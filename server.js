require('dotenv').config()

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripePublicKey = process.env.STRIPE_PUBLISHABLE_KEY
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

const express = require('express')
const app = express()
const fs = require('fs')
const bodyParser = require('body-parser')
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)
const { v4 } = require('uuid')
const id = v4()
const nodemailer = require('nodemailer')
const path = require('path')
const cors = require('cors')
const SERVER_URL = process.env.SERVER_URL
const mongoDbLink = process.env.MONGODB_LINK
const nodemailerHost = process.env.NODEMAILER_HOST
const nodemailerAuthEmail = process.env.NODEMAILER_AUTH_EMAIL
const nodemailerAuthPassword = process.env.NODEMAILER_AUTH_PASSWORD

app(cors())

const mongoose = require('mongoose')
mongoose.connect(mongoDbLink, {useNewUrlParser: true, useUnifiedTopology: true})
const Schema = mongoose.Schema

const schema = new Schema({
    email: {type: String, required: true},
    product: {type: String, required: true},
    quantity: {type: Number, required: true},
    price: {type: Number, required: true},
    date: {type: String, required: true},
    id: {type: String, required: true},
    accounts: {type: String, required: true}
})

const Order = mongoose.model('Order', schema)

app.use(bodyParser.json())

const { resolve } = require('path')

app.post('/stripe-checkout', async (req, res) => {
    const session = await stripe.checkout.sessions.create({
      success_url: `${SERVER_URL}/order?id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SERVER_URL}`,
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: req.body.emailInput,
      metadata: {
        date: req.body.date,
        textFile: req.body.textFile,
        itemImage: req.body.itemImage,
        stock: req.body.stock,
        accounts: req.body.outputHTML
      },
      line_items: [{
        price_data: {
            currency: 'usd',
            product_data: {
              name: req.body.itemName,
              images: [req.body.itemImage]
            },
            unit_amount: req.body.price,
        },
        quantity: req.body.quantity,
      }]
    })

    res.json({
        id: session.id,
    })
})

app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.json())

app.get('/', function(req, res) {
    fs.readFile('items.json', function(error, data) {
        if (error) {
            res.status(500).end()
        } else {
            res.render('index.ejs', {
                items: JSON.parse(data)
            })
        }
    })
})

app.post('/webhook', async (req, res) => {
  const event = req.body

  switch (event.type) {
    case 'checkout.session.completed': {
      const email = event['data']['object']['customer_email']
      const sessionId = event['data']['object']['id']
      const session = await stripe.checkout.sessions.retrieve(
          sessionId,
          {
            expand: ['line_items'],
          }
        );
      const productName = session.line_items.data[0].description
      const productQuantity = session.line_items.data[0].quantity
      const amount = session.amount_total
      const date = session.metadata.date
      const textFile1 = 'public/' + session.metadata.textFile
      const stock = session.metadata.stock

      const filePath = path.join(__dirname, textFile1)
      const fileData = fs.readFileSync(filePath, 'utf-8')
      const file = fileData.split('\r\n')

      let nLines = productQuantity
      let outputHTML = ''
  
      for (let i = 0; i < nLines; i++) {
          var lines = fileData.split('\n')
          outputHTML += lines[i]
          file.splice(i - stock, 1)
      }

      const dataString = file.join('\r\n')
      fs.writeFileSync(filePath, dataString)

      const order = new Order({
          email: email,
          product: productName,
          quantity: productQuantity,
          price: amount,
          date: date,
          id: sessionId,
          accounts: outputHTML
      })
      order.save()

      const output = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Document</title>
          <style>
              @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@500&display=swap');
              @import url('https://fonts.googleapis.com/css2?family=Permanent+Marker&display=swap');
              @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
              @import url('https://fonts.googleapis.com/css2?family=Raleway:wght@200;300&display=swap');

              .main {
                  width: 1500px;
                  height: 850px;
                  background-color: #1b1b1b;
                  position: relative;
              }

              .main .main-box {
                  width: 700px;
                  height: 850px;
                  background-color: #272727;
                  position: absolute;
                  top: 0;
                  right: 0;
                  left: 0;
                  bottom: 0;
                  margin: auto;
              }

              .main .main-box .main-box-header {
                  width: 100%;
                  height: 20%;
                  position: relative;
                  border-bottom: 4px solid #0088a9;
              }

              .main .main-box .main-box-header .main-box-header-main {
                width: 100px;
                height: 100px;
                position: absolute;
                top: 0;
                left: 0;
                bottom: 0;
                right: 0;
                margin: auto;
                padding-top: 32px;
              }

              .main .main-box .main-box-header .main-box-header-main img {
                  width: 100%;
                  height: 100%;
              }

              .main .main-box .main-box-main {
                  width: 100%;
                  height: 80%;
              }

              .main .main-box .main-box-main .main-box-main-header {
                  width: 100%;
                  height: 14%;
                  position: relative;
              }

              .main .main-box .main-box-main .main-box-main-header .main-box-main-header-main {
                  padding-left: 15px;
              }

              .main .main-box .main-box-main .main-box-main-header .main-box-main-header-main .main-box-main-header-main1 {
                  font-size: 22px;
                  color: #edf0f1;
                  font-weight: 500;
                  font-family: "Montserrat", sans-serif;
                  text-decoration: none;
              }

              .main .main-box .main-box-main .main-box-main-header .main-box-main-header-main .main-box-main-header-main2 {
                  font-size: 15px;
                  color: #d9dbdb;
                  font-weight: 500;
                  font-family: "Montserrat", sans-serif;
                  text-decoration: none;
              }

              .main-box-main-header-main-border-bottom-main {
                  width: 100%;
                  position: relative;
                  padding-top: 10px;
              }

              .main-box-main-header-main .main-box-main-header-main-border-bottom {
                  width: 80%;
                  position: absolute;
                  left: 0;
                  right: 0;
                  margin: auto;
                  border: 1px solid #0088a9;
              }

              .main .main-box .main-box-main .main-box-main-order {
                  width: 100%;
                  height: 43%;
              }

              .main .main-box .main-box-main .main-box-main-order .main-box-main-order-header1 {
                  font-size: 24px;
                  color: #edf0f1;
                  font-weight: 500;
                  font-family: "Montserrat", sans-serif;
                  text-decoration: none;
                  text-align: center;
              }

              .main .main-box .main-box-main .main-box-main-order .main-box-main-order-header2 {
                  width: 100%;
                  height: 15%;
                  position: relative;
              }

              .main .main-box .main-box-main .main-box-main-order .main-box-main-order-header2 .main-box-main-order-header-main2 {
                  width: 110px;
                  height: 100%;
                  position: absolute;
                  top: 0;
                  left: 0;
                  bottom: 0;
                  right: 0;
                  margin: auto;
              }

              .main .main-box .main-box-main .main-box-main-order .main-box-main-order-header2 .main-box-main-order-header-main2 .view-order-button {
                width: 100%;
                height: 100%;
                background-color: #0088a9;
                border-radius: 10px;
                font-size: 18px;
                text-align: center;
                background-color: #0088a9;
                border: none;
                transition: all 0.3s ease 0s;
                outline: none;
                cursor: pointer;
                font-family: "Montserrat", sans-serif;
                font-weight: 500;
                font-size: 15.8px;
                color: #edf0f1;
                text-decoration: none;
                box-shadow: 0 0 20px #0088a9;
              }

              .main .main-box .main-box-main .main-box-main-order .main-box-main-order-header2 .main-box-main-order-header-main2 .view-order-button:hover {
                background-color: #29abcc;
              }

              .main .main-box .main-box-main .main-box-main-order .main-box-main-order-main {
                  width: 100%;
                  height: 191.55px;
                  position: relative;
                  padding-top: 15px;
              }

              .main .main-box .main-box-main .main-box-main-order .main-box-main-order-main .main-box-main-order-main-inside {
                  width: 80%;
                  height: 80%;
                  background-color: #1f1f1f;
                  border-radius: 10px;
                  box-shadow: 0 0 15px #222222;
                  position: absolute;
                  top: 0;
                  bottom: 0;
                  left: 0;
                  right: 0;
                  margin: auto;
              }

              .main .main-box .main-box-main .main-box-main-order .main-box-main-order-main .main-box-main-order-main-inside .main-box-main-order-main-inside-contents {
                  width: 30%;
                  height: 100%;
                  float: left;
                  background-color: #1d1d1d;
                  border-radius: 10px;
              }

              .main .main-box .main-box-main .main-box-main-order .main-box-main-order-main .main-box-main-order-main-inside .main-box-main-order-main-inside-contents .main-box-main-order-main-inside-contents-content {
                  width: 100%;
                  height: 32%;
                  font-size: 16px;
                  color: #edf0f1;
                  font-weight: 500;
                  font-family: "Montserrat", sans-serif;
                  text-decoration: none;
                  text-align: center;
                  position: relative;
              }

              .main .main-box .main-box-main .main-box-main-order .main-box-main-order-main .main-box-main-order-main-inside .main-box-main-order-main-inside-contents .main-box-main-order-main-inside-contents-content p {
                  position: absolute;
                  top: 0;
                  left: 0;
                  right: 0;
                  bottom: 0;
                  margin: auto;
                  padding-top: 10px;
              }

              .main .main-box .main-box-main .main-box-main-order .main-box-main-order-main .main-box-main-order-main-inside .main-box-main-order-main-inside-output {
                  width: 69%;
                  height: 100%;
                  float: right;
              }

              .main .main-box .main-box-main .main-box-main-order .main-box-main-order-main .main-box-main-order-main-inside .main-box-main-order-main-inside-output .main-box-main-order-main-inside-output-content {
                  width: 100%;
                  height: 32%;
                  text-align: center;
                  font-size: 16px;
                  color: #edf0f1;
                  font-weight: 500;
                  font-family: "Montserrat", sans-serif;
                  text-decoration: none;
                  position: relative;
              }

              .main .main-box .main-box-main .main-box-main-order .main-box-main-order-main .main-box-main-order-main-inside .main-box-main-order-main-inside-output .main-box-main-order-main-inside-output-content1 {
                  width: 100%;
                  height: 32%;
                  text-align: center;
                  font-size: 16px;
                  color: #edf0f1;
                  font-weight: 500;
                  font-family: "Montserrat", sans-serif;
                  text-decoration: none;
                  position: relative;
                  overflow-wrap: break-word;
              }

              .main .main-box .main-box-main .main-box-main-order .main-box-main-order-main .main-box-main-order-main-inside .main-box-main-order-main-inside-output .main-box-main-order-main-inside-output-content p {
                  position: absolute;
                  top: 0;
                  left: 0;
                  right: 0;
                  bottom: 0;
                  margin: auto;
                  padding-top: 10px;
              }

              .main .main-box .main-box-main .main-box-main-order .main-box-main-order-main .main-box-main-order-main-inside .main-box-main-order-main-inside-output .main-box-main-order-main-inside-output-content1 .main-box-main-order-main-inside-output-content-text1 {
                  position: absolute;
                  top: 0;
                  left: 0;
                  right: 0;
                  bottom: 0;
                  margin: auto;
                  padding-top: 3px;
              }
          </style>
      </head>
      <body>
          <div class="main">
              <div class="main-box">
                  <div class="main-box-header">
                      <div class="main-box-header-main">
                          <img src="https://i.ibb.co/Drm04X8/swift-white.png" id="header-image" width="100px" height="100px">
                      </div>
                  </div>

                  <div class="main-box-main">
                      <div class="main-box-main-header">
                          <div class="main-box-main-header-main">
                              <div class="main-box-main-header-main1">
                                  <p>Hello Customer</p>
                              </div>

                              <div class="main-box-main-header-main2">
                                  <p>Thank you for buying our products at SwiftAlts.xyz! Your payment has been recieved and approved.</p>
                              </div>

                              <div class="main-box-main-header-main-border-bottom-main">
                                  <div class="main-box-main-header-main-border-bottom"></div>
                              </div>
                          </div>
                      </div>

                      <div class="main-box-main-order">
                          <div class="main-box-main-order-header1">
                              <p>Order Details</p>
                          </div>

                          <div class="main-box-main-order-header2">
                              <div class="main-box-main-order-header-main2">
                                  <a href="${SERVER_URL}/order?id=${sessionId}"><button class="view-order-button" id="view-order-button">View Order</button></a>
                              </div>
                          </div>

                          <br>

                          <div class="main-box-main-order-main">
                              <div class="main-box-main-order-main-inside">
                                  <div class="main-box-main-order-main-inside-contents">
                                      <div class="main-box-main-order-main-inside-contents-content"><p class="main-box-main-order-main-inside-contents-content-text">Order ID</p></div>
                                      <div class="main-box-main-order-main-inside-contents-content"><p class="main-box-main-order-main-inside-contents-content-text">Product</p></div>
                                      <div class="main-box-main-order-main-inside-contents-content"><p class="main-box-main-order-main-inside-contents-content-text">Quantity</p></div>
                                  </div>

                                  <div class="main-box-main-order-main-inside-output">
                                      <div class="main-box-main-order-main-inside-output-content1"><p class="main-box-main-order-main-inside-output-content-text1">${sessionId}</p></div>
                                      <div class="main-box-main-order-main-inside-output-content"><p class="main-box-main-order-main-inside-output-content-text">${productName}</p></div>
                                      <div class="main-box-main-order-main-inside-output-content"><p class="main-box-main-order-main-inside-output-content-text">${productQuantity}</p></div>
                                  </div>
                              </div>
                          </div>
                      </div>

                      <br>

                      <div class="main-box-main">
                        <div class="main-box-main-order">
                            <div class="main-box-main-order-main">
                                <div class="main-box-main-order-main-inside">
                                    <div class="main-box-main-order-main-inside-contents">
                                        <div class="main-box-main-order-main-inside-contents-content"><p class="main-box-main-order-main-inside-contents-content-text">Payment Gateway</p></div>
                                        <div class="main-box-main-order-main-inside-contents-content"><p class="main-box-main-order-main-inside-contents-content-text">Amount</p></div>
                                        <div class="main-box-main-order-main-inside-contents-content"><p class="main-box-main-order-main-inside-contents-content-text">Date</p></div>
                                    </div>
  
                                    <div class="main-box-main-order-main-inside-output">
                                        <div class="main-box-main-order-main-inside-output-content"><p class="main-box-main-order-main-inside-output-content-text">Stripe</p></div>
                                        <div class="main-box-main-order-main-inside-output-content"><p class="main-box-main-order-main-inside-output-content-text">$${amount / 100}</p></div>
                                        <div class="main-box-main-order-main-inside-output-content"><p class="main-box-main-order-main-inside-output-content-text">${date}</p></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                  </div>
              </div>
          </div>
      </body>
      </html>
      `

      const transporter = nodemailer.createTransport({
        host: `${nodemailerHost}`,
        auth: {
          user: `${nodemailerAuthEmail}`,
          pass: `${nodemailerAuthPassword}`
        }
      })

      const options = {
        from: `"SwiftAlts" ${nodemailerAuthEmail}`,
        to: `${email}`,
        subject: "Purchase Complete",
        html: output
      }

      transporter.sendMail(options, function (err, info) {
        if (err) {
          console.log(err)
          return
        }
      })
      break;
    }
    default:
      return res.status(400).end()
  }

  res.json({received: true})
})

app.get('/order', (req, res) => {
    const path = resolve(process.env.STATIC_DIR + "/success.html")
    res.sendFile(path)
})

app.get('/checkout-session', async (req, res) => {
  const session = await stripe.checkout.sessions.retrieve(
    req.query.id,
    {
      expand: ['line_items'],
    }
  )
  res.json(session)
})

app.post('/data', (req, res) => {
    const orderId = req.body.orderId
    Order.find({id: orderId}, (err, orders) => {
        if (err) {
            res.json(err)
        } else {
            res.json(orders)
        }
    })
})

app.get('/cancel', (req, res) => res.send('Cancelled'));

app.listen(3000, console.log('Server started!'))