require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const mysql = require('mysql2/promise');
const multer = require('multer'); 
const path = require('path'); 
const fs = require('fs'); 
const app = express();


app.use(express.json());
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.static('public'));




const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'immobilier',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);




(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Connecté à la base de données MySQL');
        connection.release();
    } catch (err) {
        console.error('Erreur de connexion à la base de données:', err);
        process.exit(1); 
    }
})();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
       
        if (!fs.existsSync('uploads')) {
            fs.mkdirSync('uploads');
        }
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});


const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'images') {
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            } else {
                cb(new Error('Seules les images sont autorisées'), false);
            }
        } else if (file.fieldname === 'documents') {
            if (file.mimetype === 'application/pdf') {
                cb(null, true);
            } else {
                cb(new Error('Seuls les fichiers PDF sont autorisés'), false);
            }
        }
    }
}).fields([
    { name: 'images', maxCount: 10 },
    { name: 'documents', maxCount: 5 }
]);




app.use('/uploads', express.static('uploads'));

/*------ login ------------------------------------------------------------------------------------*/
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email et mot de passe requis' });
        }

        const [rows] = await pool.query(
            'SELECT id, email, password, role FROM users WHERE email = ?', 
            [email.toLowerCase().trim()]
        );

        if (!rows.length) {
            return res.status(401).json({ error: 'Identifiants incorrects' });
        }

        const user = rows[0];
       
        if (!user.password.startsWith('$2a$')) {
            console.error('Mot de passe non haché détecté pour:', user.email);
            return res.status(500).json({ 
                error: 'Problème de configuration du compte. Contactez l\'administrateur.' 
            });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Identifiants incorrects' });
        }

        res.json({
            id: user.id,
            email: user.email,
            role: user.role
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la connexion' });
    }
});

/*-------------- Gestion des propriétés --------------*/

app.post('/api/properties', async (req, res) => {
    try {
        upload(req, res, async (err) => {
            if (err instanceof multer.MulterError) {
                return res.status(400).json({ error: err.message });
            } else if (err) {
                return res.status(400).json({ error: err.message });
            }

            const { 
                title, 
                description, 
                property_type_id, 
                wilaya,
                baladiya,
                neighborhood,
                status_id, 
                area, 
                price, 
                rooms, 
                bedrooms, 
                bathrooms, 
                document_number 
            } = req.body;

            // 1. Insérer la localisation
            const [locationResult] = await pool.query(
                `INSERT INTO locations 
                (wilaya, baladiya, neighborhood)
                VALUES (?, ?, ?)`,
                [wilaya, baladiya, neighborhood]
            );

            const location_id = locationResult.insertId;

            // 2. Insérer la propriété
            const [propertyResult] = await pool.query(
                `INSERT INTO properties 
                (title, description, property_type_id, location_id, status_id, 
                 area, price, rooms, bedrooms, bathrooms, document_number)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    title, description, property_type_id, location_id, status_id,
                    area, price, rooms, bedrooms, bathrooms, document_number
                ]
            );

            // 3. Insérer les images
            if (req.files.images) {
                for (let i = 0; i < req.files.images.length; i++) {
                    await pool.query(
                        `INSERT INTO property_images 
                        (property_id, image_url, is_main)
                        VALUES (?, ?, ?)`,
                        [propertyResult.insertId, req.files.images[i].filename, i === 0]
                    );
                }
            }

            // 4. Insérer les documents
            if (req.files.documents) {
                for (let i = 0; i < req.files.documents.length; i++) {
                    await pool.query(
                        `INSERT INTO property_documents 
                        (property_id, document_url, document_name)
                        VALUES (?, ?, ?)`,
                        [
                            propertyResult.insertId, 
                            req.files.documents[i].filename,
                            req.files.documents[i].originalname
                        ]
                    );
                }
            }

            res.status(201).json({ 
                message: 'Propriété ajoutée avec succès',
                propertyId: propertyResult.insertId
            });
        });
    } catch (error) {
        console.error('Error adding property:', error);
        res.status(500).json({ error: 'Erreur serveur lors de l\'ajout de la propriété' });
    }
});



app.get('/api/properties', async (req, res) => {
    try {
        const [properties] = await pool.query(`
            SELECT p.*, 
                   pt.name AS property_type, 
                   ps.status, 
                   l.wilaya, 
                   l.baladiya, 
                   l.neighborhood
            FROM properties p
            LEFT JOIN property_types pt ON p.property_type_id = pt.id
            LEFT JOIN property_status ps ON p.status_id = ps.id
            LEFT JOIN locations l ON p.location_id = l.id
        `);
        
        res.json(properties);
    } catch (error) {
        console.error('Error fetching properties:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la récupération des propriétés' });
    }
});

 //Get property types
app.get('/api/property-types', async (req, res) => {
    try {
        const [types] = await pool.query('SELECT * FROM property_types');
        res.json(types);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});



// Get property statuses
app.get('/api/property-status', async (req, res) => {
    try {
        const [statuses] = await pool.query('SELECT * FROM property_status');
        res.json(statuses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});


//client 
app.get('/api/clients', async (req, res) => {
    try {
        const [clients] = await pool.query('SELECT * FROM clients ORDER BY date_creation DESC');
        res.json(clients);
    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la récupération des clients' });
    }
});

app.get('/api/clients/:id', async (req, res) => {
    try {
        const clientId = req.params.id;
        
        const [client] = await pool.query('SELECT * FROM clients WHERE id = ?', [clientId]);
        if (client.length === 0) {
            return res.status(404).json({ error: 'Client non trouvé' });
        }
        
        const [interactions] = await pool.query(
            'SELECT * FROM interactions WHERE client_id = ? ORDER BY date_interaction DESC', 
            [clientId]
        );
        
        res.json({
            client: client[0],
            interactions
        });
    } catch (error) {
        console.error('Error fetching client details:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la récupération des détails du client' });
    }
});

app.post('/api/clients', async (req, res) => {
    try {
        const {
            nom,
            telephone,
            email,
            adresse,
            type_client,
            type_bien,
            budget,
            statut
        } = req.body;
        
        const [result] = await pool.query(
            `INSERT INTO clients 
            (nom, telephone, email, adresse, type_client, type_bien, budget, statut)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [nom, telephone, email, adresse, type_client, type_bien, budget || null, statut || 'tiède']
        );
        
        res.status(201).json({
            message: 'Client créé avec succès',
            clientId: result.insertId
        });
    } catch (error) {
        console.error('Error creating client:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la création du client' });
    }
});

app.put('/api/clients/:id', async (req, res) => {
    try {
        const clientId = req.params.id;
        const {
            nom,
            telephone,
            email,
            adresse,
            type_client,
            type_bien,
            budget,
            statut
        } = req.body;
        
        const [result] = await pool.query(
            `UPDATE clients SET 
            nom = ?, telephone = ?, email = ?, adresse = ?, 
            type_client = ?, type_bien = ?, budget = ?, statut = ?
            WHERE id = ?`,
            [nom, telephone, email, adresse, type_client, type_bien, budget || null, statut || 'tiède', clientId]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Client non trouvé' });
        }
        
        res.json({ message: 'Client mis à jour avec succès' });
    } catch (error) {
        console.error('Error updating client:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la mise à jour du client' });
    }
});

app.delete('/api/clients/:id', async (req, res) => {
    try {
        const clientId = req.params.id;
        
        const [result] = await pool.query('DELETE FROM clients WHERE id = ?', [clientId]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Client non trouvé' });
        }
        
        res.json({ message: 'Client supprimé avec succès' });
    } catch (error) {
        console.error('Error deleting client:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la suppression du client' });
    }
});

app.post('/api/clients/:id/interactions', async (req, res) => {
    try {
        const clientId = req.params.id;
        const { type_interaction, details } = req.body;
        
        // Vérifier que le client existe
        const [client] = await pool.query('SELECT id FROM clients WHERE id = ?', [clientId]);
        if (client.length === 0) {
            return res.status(404).json({ error: 'Client non trouvé' });
        }
        
        const [result] = await pool.query(
            `INSERT INTO interactions 
            (client_id, type_interaction, details)
            VALUES (?, ?, ?)`,
            [clientId, type_interaction, details]
        );
        
        res.status(201).json({
            message: 'Interaction ajoutée avec succès',
            interactionId: result.insertId
        });
    } catch (error) {
        console.error('Error adding interaction:', error);
        res.status(500).json({ error: 'Erreur serveur lors de l\'ajout de l\'interaction' });
    }
});

app.get('/api/clients/stats', async (req, res) => {
    try {
        const [total] = await pool.query('SELECT COUNT(*) as total FROM clients');
        const [vip] = await pool.query('SELECT COUNT(*) as vip FROM clients WHERE statut = "VIP"');
        const [chaud] = await pool.query('SELECT COUNT(*) as chaud FROM clients WHERE statut = "chaud"');
        const [froid] = await pool.query('SELECT COUNT(*) as froid FROM clients WHERE statut = "froid"');
        const [types] = await pool.query('SELECT type_client, COUNT(*) as count FROM clients GROUP BY type_client');
        
        res.json({
            total: total[0].total,
            vip: vip[0].vip,
            chaud: chaud[0].chaud,
            froid: froid[0].froid,
            types
        });
    } catch (error) {
        console.error('Error fetching client stats:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la récupération des statistiques' });
    }
});

// Get all employees
app.get('/api/employees', async (req, res) => {
    try {
        const [employees] = await pool.query('SELECT * FROM employees ORDER BY created_at DESC');
        res.json(employees);
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({ error: 'Error fetching employees' });
    }
});

// Get single employee
app.get('/api/employees/:id', async (req, res) => {
    try {
        const [employees] = await pool.query('SELECT * FROM employees WHERE id = ?', [req.params.id]);
        if (employees.length === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        res.json(employees[0]);
    } catch (error) {
        console.error('Error fetching employee:', error);
        res.status(500).json({ error: 'Error fetching employee' });
    }
});

// Create employee
app.post('/api/employees', async (req, res) => {
    try {
        const { nom, position, telephone, email, hire_date, permissions } = req.body;
        
        const [result] = await pool.query(
            `INSERT INTO employees 
            (nom, position, telephone, email, hire_date, permissions)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [nom, position, telephone, email, hire_date, JSON.stringify(permissions)]
        );
        
        res.status(201).json({ 
            message: 'Employee created successfully',
            employeeId: result.insertId
        });
    } catch (error) {
        console.error('Error creating employee:', error);
        res.status(500).json({ error: 'Error creating employee' });
    }
});

// Update employee
app.put('/api/employees/:id', async (req, res) => {
    try {
        const { nom, position, telephone, email, hire_date, permissions } = req.body;
        
        const [result] = await pool.query(
            `UPDATE employees SET 
            nom = ?, position = ?, telephone = ?, email = ?, hire_date = ?, permissions = ?
            WHERE id = ?`,
            [nom, position, telephone, email, hire_date, JSON.stringify(permissions), req.params.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        
        res.json({ message: 'Employee updated successfully' });
    } catch (error) {
        console.error('Error updating employee:', error);
        res.status(500).json({ error: 'Error updating employee' });
    }
});

// Delete employee
app.delete('/api/employees/:id', async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM employees WHERE id = ?', [req.params.id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        
        res.json({ message: 'Employee deleted successfully' });
    } catch (error) {
        console.error('Error deleting employee:', error);
        res.status(500).json({ error: 'Error deleting employee' });
    }
});

// Get employee activities
app.get('/api/employees/:id/activities', async (req, res) => {
    try {
        const [activities] = await pool.query(
            'SELECT * FROM employee_activities WHERE employee_id = ? ORDER BY date DESC',
            [req.params.id]
        );
        res.json(activities);
    } catch (error) {
        console.error('Error fetching employee activities:', error);
        res.status(500).json({ error: 'Error fetching employee activities' });
    }
});

// Add employee activity
app.post('/api/employees/:id/activities', async (req, res) => {
    try {
        const { type, details } = req.body;
        
        const [result] = await pool.query(
            `INSERT INTO employee_activities 
            (employee_id, type, details)
            VALUES (?, ?, ?)`,
            [req.params.id, type, details]
        );
        
        res.status(201).json({ 
            message: 'Activity added successfully',
            activityId: result.insertId
        });
    } catch (error) {
        console.error('Error adding employee activity:', error);
        res.status(500).json({ error: 'Error adding employee activity' });
    }
});
//

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});