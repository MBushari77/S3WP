const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mysql = require('mysql');
const session = require('express-session');
const upload = require('express-fileupload');


const app = express();


var sql = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'webproject'
});

sql.connect((err)=>{
	if (!err) {
		console.log("DB is connected");
	}
	else{
		// console.log("DB connection faild... \n Error: \n" + JSON.stringify(err));
		console.log("DB is not connected\n")
	}
});
// view engine
app.engine('handlebars', exphbs({
	defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');
// connecting to static folder
app.use(express.static('static'));
// connection the body parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// set up the cookie parser
app.use(cookieParser());
// Setting up the express file upload module
app.use(upload());


// ##################################################################################
// INDEX
app.get('/', (req, res) =>{
	res.render('index', {wrongPassword: false});
})
// ##################################################################################
// REGISTERING
app.get('/register', (req, res) => {
	res.render('register');
});
app.post('/registering', (req, res) => {
	let name = req.body.name
	let username = req.body.username
	let password = req.body.password
	let gender = req.body.gender
	sql.query(`INSERT INTO user (name, username, password, gender, joindate) VALUES ('${name}', '${username}', '${password}', '${gender}', '${Date().slice(0, 15)}');`, function(err, result){
		if (err){
			throw err
		}
		res.redirect('/');
	});
});

// ##################################################################################
// HOME
app.get('/home', (req, res) => {
	sql.query(`SELECT * FROM user WHERE id <> ${req.cookies.userid};`, function(err, sqlData){
		if (err) {
			throw err;
		}
		else{
			res.render('home', {users: sqlData});
		}
	});
});
app.post('/logining', (req, res) => {
	let username = req.body.username;
	let password = req.body.password;
	sql.query(`SELECT * FROM user WHERE username = '${username}' AND password = '${password}';`, function(err, sqlData){
		if (err) {
			throw err;
		}
		if (sqlData.length < 1) {
			res.render('index', {wrongPassword: true});
		}
		else{
			res.cookie('userid', sqlData[0].id);
			res.redirect('home')
			// res.render('home', {sqlData: sqlData[0]});
		}
	});
});

// ##################################################################################
// Chat
app.get('/chat/:id', (req, res) => {
	if (req.cookies.userid == undefined) {
		res.redirect('/');
	}
	else{
		res.render('chat', {id: req.params.id});
	}
});
app.get('/msgs/:id', (req, res) => {
		let me = req.cookies.userid;
		let friend = req.params.id;
		sql.query(`SELECT * FROM msgs WHERE  seen = 'no' AND senderid = ${friend} AND reciverid = ${me};`, function(err, sqlData){
			if (err) {
				throw err;
			}
			else{
				sql.query(`UPDATE msgs SET seen = 'yes' WHERE seen = 'no' AND reciverid = ${me}; `)
				res.send(sqlData);
			}
		});
});
app.get('/oldmsgs/:id', (req, res) => {
		let sender = req.cookies.userid;
		let reciver = req.params.id;
		sql.query(`SELECT * FROM msgs WHERE senderid = ${sender} AND reciverid = ${reciver} OR senderid = ${reciver} AND reciverid = ${sender};`, function(err, sqlData){
			if (err) {
				throw err;
			}
			else{
				res.send(sqlData);
			}
		});
});
app.post('/send/:reciverid', (req, res) => {
	sql.query(`INSERT INTO msgs (senderid, reciverid, content, time, seen) VALUES(${req.cookies.userid}, ${req.params.reciverid}, '${req.body.content}', '${Date().slice(0, 21)}', 'no')`);
	// console.log(req.body.content);
	res.send('done')
});
app.post('/deletemsg/:id', (req, res) => {
	sql.query(`DELETE FROM msgs WHERE id = ${req.params.id};`);
});
app.post('/editmsg/:id', (req, res) => {
	sql.query(`UPDATE msgs SET content = '${req.body.content}' WHERE id = ${req.params.id};`);
});
// ##################################################################################
// SEARCH
app.get('/search', (req, res) => {
	console.log(req.cookies.userid);
	res.render('search');
});

app.post('/searching', (req, res) => {
	let key = req.body.key;
	sql.query(`SELECT * FROM user WHERE username LIKE '${key}';`, function(err, sqlData){
		if (err) {
			throw err;
		}
		else{
			console.log(sqlData);
			res.render('search', {sqlData: sqlData, oldkey: key});
		}
	});
});

// ##################################################################################
// BLOCKED
app.get('/blocked', (req, res) => {
	res.render('blocked');
});


// ##################################################################################
// PROFILE
app.get('/profile/:id', (req, res) => {
	if (req.cookies.userid == undefined) {
		res.redirect('/');
	}
	sql.query(`SELECT * FROM user WHERE id = ${req.params.id};`, function(err, sqlData){
		if (err) {
			throw err;
		}
		else{
			res.render('profile', {user: sqlData[0]});
		}
	});
});


// ##################################################################################
// MYPROFILE
app.get('/myprofile', (req, res) => {
	if (req.cookies.userid == undefined) {
		res.redirect('/');
	}
	else{
		sql.query(`SELECT * FROM user WHERE id = ${req.cookies.userid};`, function(err, sqlData){
			if (err) {
				throw err;
			}
			else{
				res.render('myprofile', {user: sqlData[0]});
			}
		});
	}
});


// ###########################################################################################
// Server setup
// Alkhsasa hassslaa
const port = 5000;
// const host = '192.168.43.193';
const host = '192.168.43.24';
// const host = '192.168.43.24';
// const host = '127.0.0.1';

app.listen(port, host, () => {
	console.log(`server is running successfuly.\nHost: ${host}\nport: ${port}\n`);
});
