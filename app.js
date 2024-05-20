const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const bcrypt = require('bcrypt');
const dbpath = path.join(__dirname, 'productData.db');
const app = express();
const cors = require('cors');
const jwt = require("jsonwebtoken");
app.use(cors());
app.use(express.json());
let db = null;
const initialize = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database
    });
    app.listen(3000, () => {
      console.log('Server is start!!!');
    });
  } catch (e) {
    console.log(`Error message ${e.message}`);
    process.exit(1);
  }
};
initialize();

app.post('/register', async (request, response) => {
  const {username, email, password } = request.body;
  const createUserQuery = `select * from userData where username = '${username}';`;
  const hashedpassword = await bcrypt.hash(password, 10);
  const dbuser = await db.get(createUserQuery);
  if (dbuser === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send({message:'Password is too short'})
    } else {
      const userQuery = `insert into userData (username,email,password)
                        values(
                            '${username}',
                            '${email}',
                            '${hashedpassword}'
                        );`;
      await db.run(userQuery);
      response.status(200);
      response.send({message:'User created successfully'})
    }
  } else {
    response.status(400);
    response.send({message:'User already exists'})
  }
});

app.post('/login', async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `select * from userData where username = '${username}';`;
  const dbuser = await db.get(selectUserQuery);
  if (dbuser === undefined) {
    response.status(400);
    response.send({message:'Invalid user'})
  } else {
    const isPasswordmatched = await bcrypt.compare(password, dbuser.password);
    if (isPasswordmatched === true) {
      const payload = {
        username: username,
      };
      const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
      response.status(200);
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send({message:'Invalid password'})
    }
  }
});

app.get("/user",async (request,response)=>{
  const query = `select * from userData` 
  const userDetails = await db.all(query) 
  response.send(userDetails)
})

app.put('/change-password', async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectUserQuery = `select * from userData where username ='${username}';`;
  const dbuser = await db.get(selectUserQuery);
  if (dbuser === undefined) {
    response.status(400);
    response.send({message:'User not Regeister'})
  } else {
    const isValidPassword = await bcrypt.compare(oldPassword, dbuser.password);
    if (isValidPassword === true) {
      if (newPassword.length < 5) {
        response.status(400);
        response.send({message:'Password is too short'})
      } else {
        const hasPassword = await bcrypt.hash(newPassword, 10);
        const updatePassword = `update userData set password = '${hasPassword}' where username ='${username}';`;
        await db.run(updatePassword);
        response.status(200);
        response.send({message:'Password updated'})
      }
    } else {
      response.status(400);
      response.send({message:'Invalid current password'})
    }
  }
});


app.post("/product", async (request, response) => {
  const { array } = request.body;

  array.map(async (image) => {
    const { id, name, price, category, imageUrl} = image
    const insertImageQuery = `
        INSERT INTO product (id, name, price, category, image_url)
        VALUES (
          ${id},
          '${name}',
          ${price},
          '${category}',
          '${imageUrl}'
        )
      `;
    await db.run(insertImageQuery);
  });

  response.send("Images Successfully Added");
});

app.get("/all-products",async (request,response)=>{
  const query = `select * from product`
  const details = await db.all(query) 
  response.send(details)
})

app.get("/everything",async (request,response)=>{
  const query = `select * from product where category='Everything'`;
  const everything = await db.all(query) 
  response.send(everything)

});

app.get("/groceries",async (request,response)=>{
  const query = `select * from product where category='Groceries'`;
  const everything = await db.all(query) 
  response.send(everything)

});

app.get("/juices",async (request,response)=>{
  const query = `select * from product where category='Juice'`;
  const everything = await db.all(query) 
  response.send(everything)

});

module.exports = app;
