const express=require('express'),
	  bodyParser= require("body-parser"),
	  socketio=require("socket.io"),
	  http= require('http'),
 	  mongoose =require("mongoose");
var app = express();
var server=http.createServer(app);
var io= socketio(server);
var initial=0;
var users=[];
function userJoin(id, username, room,x,y) {
  const user = { id, username, room,x,y};

  users.push(user);

  return user;
}
function getCurrentUser(id) {
  return users.find(user => user.id === id);
}
function userLeave(id) {
  const index = users.findIndex(user => user.id === id);

  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
}
function updateMovement(id,x,y){
	users.forEach(user=>{
		if(user.id==id){
			user.x=x;
			user.y=y;
		}
	})
}
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set('view engine','ejs');
app.get("/",function(req,res){
	res.render("enter");
})
app.post("/",function(req,res){
	res.redirect("/game/"+req.body.username+"/"+req.body.id)
})
app.get("/game/:name/:id",function(req,res){
	res.render("home",{name:req.params.name,id:req.params.id});
})
io.on('connection',socket =>{
	console.log("New connection");
	socket.on('joinRoom',({username,room,x,y})=>{
		initial=1;
		const user=userJoin(socket.id,username,room,x,y);
		console.log(user);
		socket.join(user.room);
		var send=[];
		users.forEach(person=>{ 
			if(person.room==user.room){
				send.push(person);
			}
		})
	io.to(user.room).emit('render',send)
	})
	socket.on('move',({x,y})=>{
		const user=getCurrentUser(socket.id);
		updateMovement(socket.id,x,y);
		var send=[];
		users.forEach(person=>{
			if(person.room==user.room){
				send.push(person);
			}
		})
		io.to(user.room).emit('render',send);
	})
	socket.on('out',({username})=>{
		const curUser=getCurrentUser(socket.id);
	const index = users.findIndex(user => user.username === username);
	if (index !== -1) {
    users.splice(index, 1)[0];
  	}
		var send=[];
		users.forEach(person=>{ 
			if(person.room==curUser.room){
				send.push(person);
			}
		})
	io.to(curUser.room).emit('render',send)
		})
	
	socket.on('disconnect',()=>{
		
	 const user=userLeave(socket.id);	
		
	 })
})
server.listen(3000,function(){
	console.log("Server has started");
})