const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
require('dotenv').config()
const { Schema } =  mongoose


mongoose.connect(process.env.URL)
const UserSchema = new Schema({
  username: String,

})

const User = mongoose.model("User",UserSchema)

const ExerciseSchema = new Schema({
  user_id:{type:String , required:true},
  username:String,
  description:String,
  duration:Number,
  date : Date
})

const Exercise = mongoose.model("Exercise",ExerciseSchema)


app.use(cors())
app.use(express.urlencoded({extended:true}))
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.post("/api/users", async (req,res)=>{
  console.log(req.body)

  const userObj = new User({
    username:req.body.username
  })

  try{
    const user = await userObj.save()
    console.log(user)
    res.json(user)
  }catch(err){
    console.log(err)
  }
})



app.get("/api/users",async(req,res)=>{
  const users = await User.find({}).select("_id username")
  if(!users){
    res.send("No user")
  }else{
    res.json(users)
  }

})

app.post("/api/users/:_id/exercises",async (req,res)=>{
  const id = req.params._id;
  const { description , duration, date} = req.body;

  
  try{
    const user = await User.findById(id)
    if(!user){
      res.send("Could'nt find user")
      return
    }else{
      const exerciseObj = new Exercise({
        user_id: user._id,
        description,
        duration,
        date: date ? new Date(date) : new Date()
      })
      const exercise = await exerciseObj.save()
      res.json({
        _id:user._id,
        username:user.username,
        description:exercise.description,
        duration:exercise.duration,
        date: new  Date(exercise.date).toDateString()
      })

    }
  
  }catch(err){

    console.log(err)
    res.send("Error saving exercise")
  }
  
 



})

app.get("/api/users/:_id/logs",async (req,res)=>{

  const { from , to, limit } = req.query

  const id = req.params._id
  const user = await User.findById(id)


 let dateObj = {}

  if(from) {
    dateObj["$gte"] = new Date(from)

  }
  if(to) {
    dateObj["$lte"] = new Date(to)
  }

  let filter = {
     user_id: id
  }

  if(from || to ){
    filter.date = dateObj
  }

 const exercise = await Exercise.find(filter).limit(+limit ?? 500)

 const log = exercise.map(e => ({
  description:e.description,
  duration:e.duration,
  date:e.date.toDateString()

}))

res.json({
  username: user.username,
  count: exercise.length,
  _id:user._id,
  log
})

})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
