const express = require('express')
const fetch = require('node-fetch')
const cookieParser = require('cookie-parser');
const app = express()
const visitors = [];
let lurkNum = -1;

app.use(cookieParser());
app.use(express.static('public'));

const expire = (n) => {{ expires: new Date(Date.now() + n) }}

//data is info from js5 api
const addVisit = (data) => {
	let newLocation = true;
	const visitor = {
		"country": data.country,
		"region": data.region,
		"city": data.city,
		"cityStr": data.cityStr,
		"ll": data.ll
	}
	//if not new location, update count stored in global arr
	visitors.some(e => {
		if (e.cityStr === visitor.cityStr) {
			newLocation = false;
			e.count++;
			return true; 
		}
	});
	//if new location, push to global arr
	if (newLocation) {
		visitor.count = 1;
		lurkNum++;
		visitors.push(visitor);
	}
	return visitor;
}

const getIP = async (req, res, next) => {
	let ip = (req.headers['x-forwarded-for'] || req.ip);
	ip = ip.split(':');
	ip = ip[ip.length - 1];
	if ((lurkNum === -1) && ('lurk' in req.cookies)) {
		delete req.cookies.lurk;
	}
    //test ip for localserver testing
    ip = '98.207.70.219';
	try {
		if ('lurk' in req.cookies) {
			visitors[req.cookies.lurk].count++;
			req.location = visitors[req.cookies.lurk];
		}
		else {
			const init = await fetch(`https://js5.c0d3.com/location/api/ip/${ip}`)
			const data = await init.json();
			if (data.error) {
				throw new Error('UNACCEPTABLE IP ADDRESS. UNACCEPTABLEEEE!!! >:(');
			}	
			req.location = addVisit(data);
		}
		next();
	}
	catch(err) {
		res.status(500).send(`SOMETHING WENT WRONG >:(`);
		throw new Error(err);
	}
}

app.get('/api/visitors', (req, res) => res.json(visitors));

app.get('/visitors', getIP, (req, res) => {
	res.cookie(`lurk`, `${lurkNum}`, expire(42000))
  	res.render(__dirname + '/index.ejs', { data: req.location });
});

app.listen(process.env.PORT || 3003);
