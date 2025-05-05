const express = require("express")
const cors = require("cors")
const bodyParser = require("body-parser")
const { Pool } = require("pg")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const { OpenAI } = require("openai")

// Initialize Express app
const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Configure PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "wecaredb",
  password: process.env.DB_PASSWORD || "postgres",
  port: process.env.DB_PORT || 5432,
})

// Configure JWT
const JWT_SECRET = process.env.JWT_SECRET || "c28ab33c987cb04286c1d8e27afb0140dce2edaa520930928326c615cb794ea28a9e33738cb397d9fdf22ac54a2f38843520803e29cb4586f2fa1f30635614b9"

// Configure OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "uploads")
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true)
    } else {
      cb(new Error("Only images are allowed"))
    }
  },
})

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) return res.status(401).json({ message: "Access denied" })

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid or expired token" })
    req.user = user
    next()
  })
}

// Admin middleware
const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" })
  }
  next()
}

// Routes

// Auth routes
app.post("/auth/register", async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body

    // Validate role
    if (role !== "donor" && role !== "receiver") {
      return res.status(400).json({ message: "Invalid role" })
    }

    // Check if user already exists
    const userExists = await pool.query("SELECT * FROM users WHERE email = $1", [email])

    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: "User already exists" })
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Create user
    const result = await pool.query(
      "INSERT INTO users (name, email, phone, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, phone, role",
      [name, email, phone, hashedPassword, role],
    )

    const user = result.rows[0]

    // Generate JWT
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" })

    res.status(201).json({ token, user })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body

    // Find user
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email])

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    const user = result.rows[0]

    // Validate password
    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    // Generate JWT
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" })

    // Remove password from response
    delete user.password

    res.status(200).json({ token, user })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// User routes
app.get("/users/profile", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name, email, phone, role, avatar, bio FROM users WHERE id = $1", [
      req.user.id,
    ])

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" })
    }

    res.status(200).json(result.rows[0])
  } catch (error) {
    console.error("Get profile error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.put("/users/profile", authenticateToken, upload.single("avatar"), async (req, res) => {
  try {
    const { name, email, phone, bio } = req.body
    let avatarPath = null

    if (req.file) {
      avatarPath = `/uploads/${req.file.filename}`
    }

    // Check if email is already taken by another user
    if (email !== req.user.email) {
      const emailExists = await pool.query("SELECT * FROM users WHERE email = $1 AND id != $2", [email, req.user.id])

      if (emailExists.rows.length > 0) {
        return res.status(400).json({ message: "Email already in use" })
      }
    }

    // Update user profile
    let query = "UPDATE users SET name = $1, email = $2, phone = $3, bio = $4"
    const params = [name, email, phone, bio || null]

    if (avatarPath) {
      query += ", avatar = $5 WHERE id = $6 RETURNING id, name, email, phone, role, avatar, bio"
      params.push(avatarPath, req.user.id)
    } else {
      query += " WHERE id = $5 RETURNING id, name, email, phone, role, avatar, bio"
      params.push(req.user.id)
    }

    const result = await pool.query(query, params)

    res.status(200).json(result.rows[0])
  } catch (error) {
    console.error("Update profile error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Category routes
app.get("/categories", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM categories ORDER BY name")
    res.status(200).json(result.rows)
  } catch (error) {
    console.error("Get categories error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Donation routes
app.post("/donations", authenticateToken, upload.array("images", 5), async (req, res) => {
  try {
    const { title, description, categoryId, latitude, longitude } = req.body

    // Validate user is a donor
    if (req.user.role !== "donor") {
      return res.status(403).json({ message: "Only donors can create donations" })
    }

    // Start a transaction
    const client = await pool.connect()
    try {
      await client.query("BEGIN")

      // Insert donation
      const donationResult = await client.query(
        "INSERT INTO donations (title, description, category_id, user_id, latitude, longitude, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
        [title, description, categoryId, req.user.id, latitude, longitude, "pending"],
      )

      const donationId = donationResult.rows[0].id

      // Process images
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const imagePath = `/uploads/${file.filename}`
          await client.query("INSERT INTO donation_images (donation_id, image_url) VALUES ($1, $2)", [
            donationId,
            imagePath,
          ])
        }
      }

      await client.query("COMMIT")

      res.status(201).json({ id: donationId, message: "Donation created successfully" })
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Create donation error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.get("/donations", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.*, 
             c.name as category_name, 
             c.icon as category_icon,
             ARRAY_AGG(di.image_url) as images
      FROM donations d
      LEFT JOIN categories c ON d.category_id = c.id
      LEFT JOIN donation_images di ON d.id = di.donation_id
      WHERE d.status = 'pending'
      GROUP BY d.id, c.name, c.icon
      ORDER BY d.created_at DESC
    `)

    res.status(200).json(result.rows)
  } catch (error) {
    console.error("Get donations error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.get("/donations/user/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params

    // Ensure user can only see their own donations
    if (req.user.role !== "admin" && req.user.id !== Number.parseInt(userId)) {
      return res.status(403).json({ message: "Unauthorized" })
    }

    const result = await pool.query(
      `
      SELECT d.*, 
             c.name as category_name, 
             c.icon as category_icon,
             ARRAY_AGG(di.image_url) as images
      FROM donations d
      LEFT JOIN categories c ON d.category_id = c.id
      LEFT JOIN donation_images di ON d.id = di.donation_id
      WHERE d.user_id = $1
      GROUP BY d.id, c.name, c.icon
      ORDER BY d.created_at DESC
    `,
      [userId],
    )

    res.status(200).json(result.rows)
  } catch (error) {
    console.error("Get user donations error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.get("/donations/category/:categoryId", async (req, res) => {
  try {
    const { categoryId } = req.params

    const result = await pool.query(
      `
      SELECT d.*, 
             c.name as category_name, 
             c.icon as category_icon,
             ARRAY_AGG(di.image_url) as images
      FROM donations d
      LEFT JOIN categories c ON d.category_id = c.id
      LEFT JOIN donation_images di ON d.id = di.donation_id
      WHERE d.category_id = $1 AND d.status = 'pending'
      GROUP BY d.id, c.name, c.icon
      ORDER BY d.created_at DESC
    `,
      [categoryId],
    )

    res.status(200).json(result.rows)
  } catch (error) {
    console.error("Get category donations error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.get("/donations/:id", async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query(
      `
      SELECT d.*, 
             c.name as category_name, 
             c.icon as category_icon,
             ARRAY_AGG(di.image_url) as images,
             json_build_object(
               'id', u.id,
               'name', u.name,
               'email', u.email,
               'phone', u.phone,
               'avatar', u.avatar
             ) as user
      FROM donations d
      LEFT JOIN categories c ON d.category_id = c.id
      LEFT JOIN donation_images di ON d.id = di.donation_id
      LEFT JOIN users u ON d.user_id = u.id
      WHERE d.id = $1
      GROUP BY d.id, c.name, c.icon, u.id
    `,
      [id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Donation not found" })
    }

    res.status(200).json(result.rows[0])
  } catch (error) {
    console.error("Get donation error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.put("/donations/:id/accept", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { receiverId } = req.body

    // Validate user is a receiver
    if (req.user.role !== "receiver") {
      return res.status(403).json({ message: "Only associations can accept donations" })
    }

    // Check if donation exists and is pending
    const donationCheck = await pool.query("SELECT * FROM donations WHERE id = $1", [id])

    if (donationCheck.rows.length === 0) {
      return res.status(404).json({ message: "Donation not found" })
    }

    if (donationCheck.rows[0].status !== "pending") {
      return res.status(400).json({ message: "Donation is not available" })
    }

    // Update donation status
    await pool.query("UPDATE donations SET status = $1, receiver_id = $2, updated_at = NOW() WHERE id = $3", [
      "accepted",
      receiverId,
      id,
    ])

    res.status(200).json({ message: "Donation accepted successfully" })
  } catch (error) {
    console.error("Accept donation error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.put("/donations/:id/complete", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    // Check if donation exists and is accepted
    const donationCheck = await pool.query("SELECT * FROM donations WHERE id = $1", [id])

    if (donationCheck.rows.length === 0) {
      return res.status(404).json({ message: "Donation not found" })
    }

    const donation = donationCheck.rows[0]

    if (donation.status !== "accepted") {
      return res.status(400).json({ message: "Donation is not accepted" })
    }

    // Ensure only the donor can mark as completed
    if (req.user.role !== "admin" && req.user.id !== donation.user_id) {
      return res.status(403).json({ message: "Unauthorized" })
    }

    // Update donation status
    await pool.query("UPDATE donations SET status = $1, updated_at = NOW() WHERE id = $2", ["completed", id])

    res.status(200).json({ message: "Donation marked as completed" })
  } catch (error) {
    console.error("Complete donation error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.delete("/donations/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    // Check if donation exists
    const donationCheck = await pool.query("SELECT * FROM donations WHERE id = $1", [id])

    if (donationCheck.rows.length === 0) {
      return res.status(404).json({ message: "Donation not found" })
    }

    const donation = donationCheck.rows[0]

    // Ensure only the donor or admin can delete
    if (req.user.role !== "admin" && req.user.id !== donation.user_id) {
      return res.status(403).json({ message: "Unauthorized" })
    }

    // Delete donation images
    await pool.query("DELETE FROM donation_images WHERE donation_id = $1", [id])

    // Delete donation
    await pool.query("DELETE FROM donations WHERE id = $1", [id])

    res.status(200).json({ message: "Donation deleted successfully" })
  } catch (error) {
    console.error("Delete donation error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Admin routes
app.get("/admin/donations", authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.*, 
             c.name as category_name, 
             c.icon as category_icon,
             ARRAY_AGG(di.image_url) as images
      FROM donations d
      LEFT JOIN categories c ON d.category_id = c.id
      LEFT JOIN donation_images di ON d.id = di.donation_id
      GROUP BY d.id, c.name, c.icon
      ORDER BY d.created_at DESC
    `)

    res.status(200).json(result.rows)
  } catch (error) {
    console.error("Admin get donations error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.get("/admin/users", authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, phone, role, avatar, created_at FROM users ORDER BY created_at DESC",
    )

    res.status(200).json(result.rows)
  } catch (error) {
    console.error("Admin get users error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.get("/admin/stats", authenticateToken, isAdmin, async (req, res) => {
  try {
    const totalDonations = await pool.query("SELECT COUNT(*) FROM donations")
    const totalUsers = await pool.query("SELECT COUNT(*) FROM users WHERE role != $1", ["admin"])
    const pendingDonations = await pool.query("SELECT COUNT(*) FROM donations WHERE status = $1", ["pending"])
    const completedDonations = await pool.query("SELECT COUNT(*) FROM donations WHERE status = $1", ["completed"])

    res.status(200).json({
      totalDonations: Number.parseInt(totalDonations.rows[0].count),
      totalUsers: Number.parseInt(totalUsers.rows[0].count),
      pendingDonations: Number.parseInt(pendingDonations.rows[0].count),
      completedDonations: Number.parseInt(completedDonations.rows[0].count),
    })
  } catch (error) {
    console.error("Admin get stats error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.delete("/admin/users/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params

    // Check if user exists
    const userCheck = await pool.query("SELECT * FROM users WHERE id = $1", [id])

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: "User not found" })
    }

    // Prevent deleting admin users
    if (userCheck.rows[0].role === "admin") {
      return res.status(400).json({ message: "Cannot delete admin users" })
    }

    // Start a transaction
    const client = await pool.connect()
    try {
      await client.query("BEGIN")

      // Delete user's donation images
      await client.query(
        `
        DELETE FROM donation_images 
        WHERE donation_id IN (SELECT id FROM donations WHERE user_id = $1)
      `,
        [id],
      )

      // Delete user's donations
      await client.query("DELETE FROM donations WHERE user_id = $1", [id])

      // Delete user
      await client.query("DELETE FROM users WHERE id = $1", [id])

      await client.query("COMMIT")

      res.status(200).json({ message: "User deleted successfully" })
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Admin delete user error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// AI matching route
app.get("/ai/match/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params

    // Ensure user is a receiver
    if (req.user.role !== "admin" && (req.user.id !== Number.parseInt(userId) || req.user.role !== "receiver")) {
      return res.status(403).json({ message: "Unauthorized" })
    }

    // Get user profile
    const userResult = await pool.query("SELECT * FROM users WHERE id = $1", [userId])

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" })
    }

    const user = userResult.rows[0]

    // Get available donations
    const donationsResult = await pool.query(
      `
      SELECT d.*, 
             c.name as category_name,
             u.name as donor_name,
             ST_Distance(
               ST_MakePoint(d.longitude, d.latitude),
               ST_MakePoint($1, $2)
             ) as distance
      FROM donations d
      JOIN categories c ON d.category_id = c.id
      JOIN users u ON d.user_id = u.id
      WHERE d.status = 'pending'
      ORDER BY distance ASC
    `,
      [user.longitude || 0, user.latitude || 0],
    )

    const donations = donationsResult.rows

    if (donations.length === 0) {
      return res.status(200).json({ matches: [] })
    }

    // Use OpenAI to match donations
    const prompt = `
      I need to match donations to an association based on the following information:
      
      Association profile:
      - Name: ${user.name}
      - Bio: ${user.bio || "No bio provided"}
      
      Available donations:
      ${donations
        .slice(0, 10)
        .map(
          (d, i) => `
        ${i + 1}. Title: ${d.title}
           Category: ${d.category_name}
           Description: ${d.description}
           Distance: ${Math.round(d.distance / 1000)} km
           Donor: ${d.donor_name}
      `,
        )
        .join("\n")}
      
      Please rank the top 5 donations that would be most suitable for this association based on relevance and proximity.
      Return a JSON array with the following format:
      [
        { "id": donation_id, "score": relevance_score, "reason": "brief explanation" },
        ...
      ]
      Only include the donation ID, a score from 0-100, and a brief reason for the match.
    `

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a helpful assistant that matches donations to associations." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    })

    const aiResponse = JSON.parse(completion.choices[0].message.content)

    // Enhance the AI response with full donation details
    const matches = aiResponse.matches
      .map((match) => {
        const donation = donations.find((d) => d.id === match.id)
        return {
          ...match,
          donation: donation || null,
        }
      })
      .filter((match) => match.donation !== null)

    res.status(200).json({ matches })
  } catch (error) {
    console.error("AI matching error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

// Database initialization script
const initializeDatabase = async () => {
  const client = await pool.connect()
  try {
    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(20) NOT NULL,
        password VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL,
        avatar VARCHAR(255),
        bio TEXT,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS donations (
        id SERIAL PRIMARY KEY,
        title VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        category_id INTEGER REFERENCES categories(id),
        user_id INTEGER REFERENCES users(id),
        receiver_id INTEGER REFERENCES users(id),
        status VARCHAR(20) NOT NULL,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS donation_images (
        id SERIAL PRIMARY KEY,
        donation_id INTEGER REFERENCES donations(id),
        image_url VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        donation_id INTEGER REFERENCES donations(id),
        reviewer_id INTEGER REFERENCES users(id),
        reviewee_id INTEGER REFERENCES users(id),
        rating INTEGER NOT NULL,
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Insert default categories if they don't exist
    const categoriesExist = await client.query("SELECT COUNT(*) FROM categories")

    if (Number.parseInt(categoriesExist.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO categories (name, icon) VALUES
        ('Clothing', 'shirt-outline'),
        ('Food', 'fast-food-outline'),
        ('Furniture', 'bed-outline'),
        ('Electronics', 'laptop-outline'),
        ('Books', 'book-outline'),
        ('Toys', 'game-controller-outline'),
        ('Medical', 'medical-outline'),
        ('Other', 'cube-outline')
      `)
    }

    // Insert admin user if it doesn't exist
    const adminExists = await client.query("SELECT COUNT(*) FROM users WHERE role = 'admin'")

    if (Number.parseInt(adminExists.rows[0].count) === 0) {
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash("admin123", salt)

      await client.query(
        `
        INSERT INTO users (name, email, phone, password, role)
        VALUES ('Admin', 'admin@wecaredonations.com', '1234567890', $1, 'admin')
      `,
        [hashedPassword],
      )
    }

    console.log("Database initialized successfully")
  } catch (error) {
    console.error("Database initialization error:", error)
  } finally {
    client.release()
  }
}

// Initialize database on startup
initializeDatabase()
