/* ******************************************
 * This server.js file is the primary file of the
 * application. It is used to control the project.
 *******************************************/

/* Load .env BEFORE anything uses process.env */
require('dotenv').config()

/* ***********************
 * Require Statements
 *************************/
// Their stuff
const express = require("express")
const expressLayouts = require("express-ejs-layouts")
const session = require("express-session")
const bodyParser = require("body-parser")
const cookieParser = require("cookie-parser")

// My stuff
const staticRoutes = require("./routes/static")
const baseController = require("./controllers/baseController")
const inventoryRoute = require("./routes/inventoryRoute.js")
const accountRoute = require("./routes/accountRoute.js")
const messageRoute = require("./routes/messageRoute.js")
const intentionalErrorRoute = require("./routes/intentionalErrorRoute.js")
const utilities = require("./utilities/index.js")
const pool = require("./database")

// Init
const app = express()

/* ***********************
 * Middleware
 * ************************/
app.use(
  session({
    store: new (require("connect-pg-simple")(session))({
      createTableIfMissing: true,
      pool,
    }),
    // usa secret do .env, com fallback para evitar aviso deprecado
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    name: "sessionId",
    cookie: { secure: false }, // true apenas atrás de HTTPS/proxy
  })
)

// Express Messages Middleware
app.use(require("connect-flash")())
app.use(function (req, res, next) {
  res.locals.messages = require("express-messages")(req, res)
  next()
})

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieParser())

// JWT checker
app.use(utilities.checkJWTToken)

/* ***********************
 * View Engine and Templates
 *************************/
app.set("view engine", "ejs")
app.use(expressLayouts)
app.set("layout", "./layouts/layout") // Not at view root

/* ***********************
 * Routes
 *************************/
app.use(staticRoutes)

// Index route
app.get("/", utilities.handleErrors(baseController.buildHome))

// Inventory routes
app.use("/inv", inventoryRoute)

// Account routes
app.use("/account", accountRoute)

// Message routes
app.use("/message", messageRoute)

// Intentional error route. Used for testing
app.use("/ierror", intentionalErrorRoute)

// File Not Found Route - must be last route in list (404)
app.use(async (req, res, next) => {
  next({ status: 404, message: "Unfortunately, we don't have that page in stock." })
})

/* ***********************
 * Healthcheck (não usa DB)
 *************************/
app.get("/health", (req, res) => res.type("text").send("ok"))

/* ***********************
* Express Error Handler (PROTEGIDO)
* Place after all other middleware
*************************/
app.use(async (err, req, res, next) => {
  let nav = ""
  try {
    nav = await utilities.getNav()
  } catch (e) {
    console.error("getNav failed inside error handler:", e.message)
  }

  console.error(`Error at: "${req.originalUrl}": ${err.message}`)
  console.dir(err)

  const message =
    err.status == 404
      ? err.message
      : "Oh no! There was a crash. Maybe try a different route?"

  res.status(err.status || 500).render("errors/error", {
    title: err.status || "Server Error",
    message,
    nav,
  })
})

/* ***********************
 * Local Server Information
 * Values from .env (environment) file
 *************************/
const PORT = Number(process.env.PORT) || 3000

const HOST = process.env.HOST || (process.env.PORT ? "0.0.0.0" : "localhost")

// sanity check
console.log("ENV check -> HOST:", HOST, "PORT:", PORT)

/* ***********************
 * Log statement to confirm server operation
 *************************/
app.listen(PORT, HOST, () => {
  console.log(`app listening on http://${HOST}:${PORT}`)
})
