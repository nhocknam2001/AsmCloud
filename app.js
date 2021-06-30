const express = require('express')
const hbs = require('hbs')
const session = require('express-session');

var app = express();
app.set('view engine', 'hbs')

app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: 'abcc##$$0911233$%%%32222',
    cookie: { maxAge: 60000 }
}));

var MongoClient = require('mongodb').MongoClient;
var url = "mongodb+srv://anhttghc190526:anhismyname751@cluster0.9yegy.mongodb.net/test";

var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static('public'))

// Không xóa các món đồ có từ "xe"
var dsNotToDelete = ['xe oto'];

// Call databaseHandler.js file
const dbHandler = require('./databaseHandler')

// Action Insert
app.post('/doInsert', async (req, res) => {
    var nameInput = req.body.txtName;
    var priceInput = req.body.txtPrice;
    var imgUrlInput = req.body.imgUrl;
    var newProduct = { name: nameInput, price: priceInput, imgUrl: imgUrlInput };
    const results = await dbHandler.searchSanPham('', "SanPham");
    if (isNaN(priceInput) == true || priceInput == null || priceInput <= 50) {
        res.render('admin', { model: results, priceError: 'Unavailable Price!' })
    }
    else {
        await dbHandler.insertOneIntoCollection(newProduct, "SanPham");
        res.render('admin', { model: results })
    }
})

// Action Search
app.post('/search', async (req, res) => {
    const searchText = req.body.txtName;
    const results = await dbHandler.searchSanPham(searchText, "SanPham");
    const allResults = await dbHandler.searchSanPham('', "SanPham");

    if (results == -1) {
        res.render('admin', { model: allResults, searchError: 'This product is not existed' })
    }
    else {
        res.render('admin', { model: results })
    }
})

// Go To Edit
app.get('/edit', async (req, res) => {
    const id = req.query.id;
    var ObjectID = require('mongodb').ObjectID;
    const condition = { "_id": ObjectID(id) };

    const client = await MongoClient.connect(url);
    const dbo = client.db("anhttDB");
    const productToEdit = await dbo.collection("SanPham").findOne(condition);
    res.render('edit', { product: productToEdit })
})

// Action Upadte
app.post('/update', async (req, res) => {
    const id = req.body.id;
    const nameInput = req.body.txtName;
    const priceInput = req.body.txtPrice;
    const imgUrlInput = req.body.imgUrl;
    const newValues = { $set: { name: nameInput, price: priceInput, imgUrl: imgUrlInput } };
    const ObjectID = require('mongodb').ObjectID;
    const condition = { "_id": ObjectID(id) };
    const client = await MongoClient.connect(url);
    const dbo = client.db("anhttDB");
    const productToEdit = await dbo.collection("SanPham").findOne(condition);

    if (isNaN(priceInput) == true || priceInput == null || priceInput <= 50) {
        res.render('edit', { product: productToEdit, priceError: 'Unavailable price!' })
    }
    else {
        await dbo.collection("SanPham").updateOne(condition, newValues);
        const results = await dbHandler.searchSanPham('', "SanPham");
        res.render('admin', { model: results });
    }
})

// Action Delete
app.get('/delete', async (req, res) => {
    const id = req.query.id;
    var ObjectID = require('mongodb').ObjectID;
    const condition = { "_id": ObjectID(id) };

    const client = await MongoClient.connect(url);
    const dbo = client.db("anhttDB");
    const productToDelete = await dbo.collection("SanPham").findOne(condition);
    const index = dsNotToDelete.findIndex((e) => e == productToDelete.name);
    if (index != -1) {
        res.end('Unable to delete ' + dsNotToDelete[index] + 'product')
    } else {
        await dbo.collection("SanPham").deleteOne(condition);
        res.redirect('admin');
    }
})

// Action Register
app.post('/doRegister', async (req, res) => {
    const nameInput = req.body.txtName;
    const passInput = req.body.txtPassword;
    const newUser = { username: nameInput, password: passInput };
    const results = await dbHandler.searchSanPham('', "SanPham");
    if (nameInput.indexOf("@") != -1) {
        res.render('index', { model: results, nameError: 'Missing @, Please refill your account' })
    }
    else if (passInput.length < 6) {
        res.render('index', { model: results, passError: 'Password must have more than five characters!' })
    }
    else {
        await dbHandler.insertOneIntoCollection(newUser, "users");
        res.redirect('/');
    }
})

// Action Login
app.post('/login', async (req, res) => {
    const nameInput = req.body.txtName;
    const passInput = req.body.txtPassword;
    const found = await dbHandler.checkUser(nameInput, passInput);
    const results = await dbHandler.searchSanPham('', "SanPham");
    if (found) {
        req.session.username = nameInput;
        res.render('admin', { loginName: nameInput, model: results })
    } else {
        res.render('index', { model: results, errorMsg: "Login failed!" })
    }
})

// Show All Products In The Admin Page
app.get('/admin', async (req, res) => {
    const results = await dbHandler.searchSanPham('', "SanPham");
    res.render('admin', { model: results })
})

// Go To Index Page
app.get('/', async (req, res) => {
    var userName = 'Not logged In';
    if (req.session.username) {
        userName = req.session.username;
    }
    const results = await dbHandler.searchSanPham('', "SanPham");
    res.render('index', { loginName: userName, model: results })
    res.render('index')
})

// Connection
var PORT = process.env.PORT || 5000;
app.listen(PORT);
console.log('Server is running at: ' + PORT);