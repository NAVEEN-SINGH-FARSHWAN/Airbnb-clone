const Listing = require("../models/listing");
// MapTiler client import
const maptilerClient = require('@maptiler/client');
maptilerClient.config.apiKey = process.env.MAPTILER_API_KEY;

// 1. Index Layer (Category Filter Implementation)
module.exports.index = async (req, res) => {
    let { category } = req.query;
    let filter = {};
    if (category) {
        filter = { category: category };
    }
    const allListings = await Listing.find(filter);
    res.render("listings/index.ejs", { allListings });
};

// 2. Search Engine Controller
module.exports.searchListings = async (req, res) => {
    let { location } = req.query;
    if (!location) {
        return res.redirect("/listings");
    }
    // Case-insensitive regex integration to search matching destinations
    const allListings = await Listing.find({ 
        location: { $regex: location, $options: "i" } 
    });
    res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

// 3. Show Controller (Deep Populating Author and Owner Fields)
module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: {
                path: "author",
            },
        })
        .populate("owner");
        
    if (!listing) {
        req.flash("error", "Requested Listing doesn't exist!");
        return res.redirect("/listings");
    }
    res.render("listings/show.ejs", { listing });
};

// 4. Create New Resource Pipeline
module.exports.createListing = async (req, res, next) => {
    const geoData = await maptilerClient.geocoding.forward(req.body.listing.location, { limit: 1 });

    let url = req.file.path;
    let filename = req.file.filename;

    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = { url, filename };

    if (geoData.features.length > 0) {
        newListing.geometry = geoData.features[0].geometry;
    } else {
        newListing.geometry = { type: 'Point', coordinates: [0, 0] }; 
    }

    await newListing.save();
    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Requested Listing doesn't exist!");
        return res.redirect("/listings");
    }
    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
    res.render("listings/edit.ejs", { listing, originalImageUrl });
};

// 5. UPGRADED UPDATE PIPELINE (Strict Checking Enabled)
module.exports.updateListing = async (req, res) => {
    let { id } = req.params;

    // A. Pehle update bundle fetch aur query parameters extract karo
    let updateData = { ...req.body.listing };

    // B. Geospatial API Sync: Agar location badli hai toh fresh coordinates nikaalo
    if(req.body.listing.location) {
        const geoData = await maptilerClient.geocoding.forward(req.body.listing.location, { limit: 1 });
        if (geoData.features.length > 0) {
            updateData.geometry = geoData.features[0].geometry;
        }
    }

    // C. Mongoose findByIdAndUpdate logic run karo explicitly pass karke
    let listing = await Listing.findByIdAndUpdate(id, updateData, { runValidators: true, new: true });

    // D. Multi-part handling: Agar user ne nayi photo select ki hai
    if (typeof req.file !== "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename };
        await listing.save();
    }
    
    req.flash("success", "Listing Updated!");
    return res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing deleted!");
    res.redirect("/listings");
};