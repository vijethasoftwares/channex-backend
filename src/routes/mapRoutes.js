const { default: axios } = require("axios");
const express = require("express");

const router = express.Router();

router.get("/nearby-places", async (req, res) => {
  const { lat, lng } = req.query;

  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&rankby=distance&key=AIzaSyARvglBnKE3rvok7RdoGs6-1v7UEhxg4KU`
    );
    const data = response.data;

    return res.json(data);
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ error: "Error fetching nearby places", message: error });
  }
});

module.exports = router;
