const express =require("express");
const app = express();
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js");
const {isLoggedIn,isOwner,validateListing} = require("../middleware.js");
const listingController = require("../controllers/listings.js");
const multer  = require('multer');
const {storage}=require("../cloudConfig.js");

const upload = multer({ storage });

router.route("/")
.get(wrapAsync(listingController.index))
.post(
    isLoggedIn,
    upload.single("listing[image]"),
    validateListing, 
    wrapAsync(listingController.createListing)
    
);



// 2. New Route (Yeh hamesha Show Route se UPAR hona chahiye)
router.get("/new", isLoggedIn,listingController.renderNewForm);


router.route("/:id")
.get(isLoggedIn, wrapAsync(listingController.showListing))
.put(
    isLoggedIn,
    isOwner,
    upload.single("listing[image]"),

    validateListing, 
    wrapAsync(listingController.updateListing)
)
.delete(
     isLoggedIn, 
     isOwner,
     wrapAsync(listingController.destroyListing)
    );






// 5. Edit Route
router.get("/:id/edit", 
    isLoggedIn,
    isOwner,
    wrapAsync(listingController.renderEditForm));


 module.exports = router;


