const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const bcrypt = require('bcrypt');
const dbpath1 = path.join(__dirname, "userData.db");
const dbpath2 = path.join(__dirname, 'productData.db');
const app = express();
const cors = require('cors');
const jwt = require("jsonwebtoken");
app.use(cors());
app.use(express.json());
let db = null;
let database = null;
const PORT = process.env.PORT || 3000;
const initialize = async () => {
  try {
    db = await open({
      filename: dbpath2,
      driver: sqlite3.Database,
    });

    // Connect onother database file and assign the database to the variable database
    database = await open({
      filename: dbpath1,
      driver: sqlite3.Database,
    });
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
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
  const dbuser = await database.get(createUserQuery);
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
      await database.run(userQuery);
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
  const dbuser = await database.get(selectUserQuery);
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
  const userDetails = await database.all(query) 
  response.send(userDetails)
})

app.put('/change-password', async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectUserQuery = `select * from userData where username ='${username}';`;
  const dbuser = await database.get(selectUserQuery);
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
        await database.run(updatePassword);
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

app.put('/update/:id', async (request, response) => {
  const { id } = request.params;
  const { name } = request.body;

  const updateUserQuery = `
    UPDATE product
    SET name = '${name}'
    WHERE id = ${id};
  `;
  await db.run(updateUserQuery);
  response.send("Update Successfully");
});


app.get("/all-products",async (request,response)=>{
  const query = `select * from product`
  const details = await db.all(query) 
  response.send(details)
})

app.get("/everything", async (request, response) => {
  const { title = "", sort_by = "" } = request.query;

  let query = `SELECT * FROM product WHERE category = 'Everything'`;

  if (title) {
    query += ` AND name LIKE '%${title}%'`;
  }

  // Apply default sorting if no sorting option is provided
  if (sort_by === "high_to_low") {
    query += ` ORDER BY price DESC`;
  } else {
    query += ` ORDER BY price ASC`;
  }
  
  // Execute the SQL query and send the response
  const everything = await db.all(query);
  response.send(everything);
});


app.get("/groceries",async (request,response)=>{
  const { title = "", sort_by = "" } = request.query;

  let query = `select * from product where category='Groceries'`;

  if (title) {
    query += ` AND name LIKE '%${title}%'`;
  }

  // Apply default sorting if no sorting option is provided
  if (sort_by === "high_to_low") {
    query += ` ORDER BY price DESC`;
  } else {
    query += ` ORDER BY price ASC`;
  }

  const everything = await db.all(query) 
  response.send(everything)

});

app.get("/juices",async (request,response)=>{
  const { title = "", sort_by = "" } = request.query;
  
  let query = `select * from product where category='Juice'`;

  if (title) {
    query += ` AND name LIKE '%${title}%'`;
  }

  // Apply default sorting if no sorting option is provided
  if (sort_by === "high_to_low") {
    query += ` ORDER BY price DESC`;
  } else {
    query += ` ORDER BY price ASC`;
  }
  
  const everything = await db.all(query) 
  response.send(everything)

});

module.exports = app;
