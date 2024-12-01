require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require("dns");
const mongoose = require("mongoose");
const urlparser = require('url')

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true }).then(()=>{
  console.log("connected")
}).catch((err)=>{
  console.error("fail to connect")
})

const urls = mongoose.connection.collection("urls");

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}))

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', function (req, res) {
  const url = req.body.url;
  const dnslookup = dns.lookup(urlparser.parse(url).hostname, 
async (err, address) => {
  if (!address) {
    res.json({error: "invalid url"})
  } else {
    const countUrl = await urls.countDocuments({});
    const urlDoc = {
      url,
      shorten_url: countUrl
    }
    const result = await urls.insertOne(urlDoc);
    res.json({original_url: url, short_url: countUrl})
  }
})
})

app.get('/api/shorturl/:shorturl', async (req, res) => {
  const urlparam = req.params.shorturl;
  const urlDoc = await urls.findOne({shorten_url: +urlparam});
  res.redirect(urlDoc.url);
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
