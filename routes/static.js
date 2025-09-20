const express = require("express")
const path = require("path")
const router = express.Router()
const utilities = require("../utilities")

// Serve toda a pasta public diretamente (recomendado)
router.use(express.static(path.join(__dirname, "..", "public")))

// Aliases opcionais (úteis se você usa /css, /js, /images nos <link> ou <img>)
router.use(
  "/css",
  utilities.handleErrors(
    express.static(path.join(__dirname, "..", "public", "css"))
  )
)

router.use(
  "/js",
  utilities.handleErrors(
    express.static(path.join(__dirname, "..", "public", "js"))
  )
)

router.use(
  "/images",
  utilities.handleErrors(
    express.static(path.join(__dirname, "..", "public", "images"))
  )
)

module.exports = router
