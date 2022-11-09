const express = require('express')
const cors = require('cors')
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000 


app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.p7yun4g.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri)

async function main () {
  try {
    const serviceCollection = client.db('doctorarc').collection('services')
    const bookingCollection = client.db('doctorarc').collection('bookings')

    app.get('/service', async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query)
      const services = await cursor.toArray()
      res.send(services)
    })

    app.get('/available', async (req, res) => {
      const date = req.query.date || 'Nov 5, 2022';

      //step 1: get all services
      const services = await serviceCollection.find().toArray();

      // step 2: get all the bookings of that day
      const query = {date: date}
      const bookings = await bookingCollection.find(query).toArray();

      // step 3: for each service, find bookings
      services.forEach(service => {
        const serviceBookings = bookings.filter(booking => booking.treatment === service.name);
        // booked slot
        const bookedSlot = serviceBookings.map(service => service.slot);
        // available slots
        const available = service.slots.filter(slot => !bookedSlot.includes(slot));
        service.slots = available;
      
      })

      res.send(services);
    })

    app.get('/booking', async (req, res) => {
      const patient = req.query.patient;
      const query = {patient: patient};
      const bookings = await bookingCollection.find(query).toArray();
      res.send(bookings);
    })

    app.post('/booking', async (req, res) => {
      const booking = req.body;
      const query = { treatment: booking.treatment, date: booking.date, patient: booking.patient };
      const exists = await bookingCollection.findOne(query)
      if (exists) {
        return res.send({success: false, booking: exists});
      }
      const result = await bookingCollection.insertOne(booking);
      res.send({success: true , result});
    })  

  } finally {

  }
} main ().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello From Doctor uncle!')
})

app.listen(port, () => {
  console.log(`Doctors app listening on port ${port}`)
})