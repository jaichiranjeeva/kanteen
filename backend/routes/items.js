const express = require('express')
const itemRouter = express.Router();
const Item = require('../models/Menu')

//testing
itemRouter.get('/', (req, res) => {
    res.send("Items route")
})

//Get all items
itemRouter.get('/fetchall', async (req, res) => {
    try {
        const items = await Item.find();
        res.status(200).json(items);
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error")
    }
})

//Add an item
itemRouter.post('/add', async (req, res) => {
    const newItem = new Item({
        id: req.body.id,
        name: req.body.name,
        price: req.body.price,
        quantity: req.body.quantity,
        image: req.body.image,
        type: req.body.type,
        category: req.body.category
    })
    try {
        const item = await Item.findOne({ id: req.body.id });
        if (item) {
            res.status(400).json({ msg: "Item already exists", success: false })
        }
        await newItem.save();
        res.status(200).json({ msg: "Item added successfully", success: true })
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error")
    }
})

module.exports = itemRouter;