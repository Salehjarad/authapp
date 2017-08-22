const express = require('express');
const bodyParser = require('body-parser');
const _ = require('lodash');
const {ObjectId} = require('mongodb');

const {mongoose} = require('../db/db');
const {Todo} = require('../models/todo');
const {User} = require('../models/user');
const {authenticate} = require('./middleware/auth');


const app = express();

var port = process.env.PORT || process.env.port || 3000;

app.use(bodyParser.json());


app.get('/', (req, res) => {
    res.send('hello');
});


app.get('/todos', (req, res) => {
    Todo.find().then((todos) => {
        res.send(todos);
    });
});


app.get('/todos/:id', (req, res) => {
    var id = req.params.id;
    if(!ObjectId.isValid(id)) {
        return res.status(404).send({error: "invalid id"})
    }
    Todo.findById(id).then((todo) => {
        if(!todo) {
            return res.status(404).send({error: "invalid id "})
        }
        res.send(todo);
    });
});


app.post('/todos', (req, res) => {
    var body = _.pick(req.body, ['text','completed']);
    var newTodo = new Todo(body);
    newTodo.save().then((todo) => {
        if(!todo) {
            return res.status(400).send({
                error: "unable to post todo"
            })
        }
            res.status(200).send(todo);
    }, (err) => {
        res.status(400).send({error: "Error tow"})
    })
});


app.delete('/todos/:id', (req, res) => {
    var id = req.params.id;
    
    if(!ObjectId.isValid(id)) {
        return res.status(404).send({error: "id not valid"})
    }

    Todo.findByIdAndRemove(id).then((todo) => {
        if(!todo) {
            res.status(404).send({error: "no todo found"})
        }
        res.send({removed: "Done"})
    }, (err) => {
        res.status(400).send(err)
    })
});


app.patch('/todos/:id', (req, res) => {
    var body = _.pick(req.body, ['text','completed']);
    var id = req.params.id;

    if(!ObjectId.isValid(id)) {
       return res.status(404).send({error: "id not valid"})
    }

    if(_.isBoolean(body.completed) && body.completed) {
        body.completedAt = new Date().getTime();
    } else {
        body.completed = false;
        body.completedAt = null
    }

    Todo.findByIdAndUpdate(id, {$set: body}, {new: true}).then((todo) => {
        res.send(todo);
    }, (err) => {
        res.status(400).send(err);
    });
     
});

app.post('/users', (req, res) => {
    var body = _.pick(req.body, ['email', 'password']);
    var user = new User(body);
    user.save().then(() => {
        return user.generateAuthToekn();
    }).then((token) => {
        res.header('x-auth', token).send(user);
    }).catch((err) => {
        res.status(400).send(err);
    });
});


app.get('/users/me', authenticate, (req, res) => {
res.send(req.user);
});

app.listen(port, (err) => {
    if(err) return 'Error: ' + err;
    console.log(`+--[ server on port ${port} ]--+`)
});