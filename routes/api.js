'use strict'
// ↓ ↓ ↓ MY CODE ↓ ↓ ↓
const bodyParser  = require('body-parser'); // MY CODE
const express     = require('express');
let app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let mongoose = require('mongoose'); // MY CODE
mongoose.connect(process.env.DB);  // MY CODE
// ↓ ↓ ↓ BOOK SCHEMA ↓ ↓ ↓
const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  commentcount: {
    type: Number,
    default: 0
  },
  comments: {
    type: Array,
    default: []
  }
})

let Book = mongoose.model("Book", bookSchema);
// ↑ ↑ ↑ END OF BOOK SCHEMA ↑ ↑ ↑ 
module.exports = function (app) {

  app.route('/api/books')
    // ↓ ↓ ↓ FETCH ENTIRE DATABASE ↓ ↓ ↓ 
    .get(function (req, res){
      Book.find({"title": /.+/}) // USING _id WON'T WORK CAUSE IT'S OF TYPE ObjectId
        .then( books => {
          // --- FILTER WHICH PROPERTIES TO FETCH
          let response = books.map( book => ({"_id": book._id, "title": book.title, "commentcount": book.commentcount}) );
          res.json(response);
          return;
        })
        .catch( err => { console.log(err); return } )
    })
    // ↑ ↑ ↑ FETCH ENTIRE DATABASE ↑ ↑ ↑ 
    // ----------------------------------
    // ↓ ↓ ↓  ADD NEW BOOK ↓ ↓ ↓ 
    .post(function (req, res){
      let title = req.body.title;
      new Book({title: req.body.title}).save()
        .then(book => {
            res.json({title: book.title, _id: book._id})
        })
        .catch( err =>{
          res.send("missing required field title")
        })
    })
    // ↑ ↑ ↑ ADD NEW BOOK ↑ ↑ ↑ 
    // --------------------------
    // ↓ ↓ ↓  DELETE ENTIRE DATABASE ↓ ↓ ↓ 
    .delete(function(req, res){
      Book.deleteMany({title: /.+/})
        .then( deletion => {
          res.send("complete delete successful")
        })
        .catch( err => {
          console.log(err);
          return
        })
      //if successful response will be 'complete delete successful'
    });
    // ↑ ↑ ↑ DELETE ENTIRE DATABASE ↑ ↑ ↑ 

  // --- C H A N G E   R O U T E S ---
  // --- C H A N G E   R O U T E S ---
  app.route('/api/books/:id')
    // ↓ ↓ ↓ FIND BOOK BY _id ↓ ↓ ↓ 
    .get(function (req, res){
      let bookid = req.params.id;
      Book.findById(bookid)
        .then( book => {
          // let result = book.map(book => ());
          res.json({"_id": book._id, "title": book.title, "comments": book.comments})
        })
        .catch( err => {
          res.send("no book exists")
        })
      //json res format: {"_id": bookid, "title": book_title, "comments": [comment,comment,...]}
    })
    // ↑ ↑ ↑ FIND BOOK BY _id ↑ ↑ ↑ 
    // ----------------------------------
    // ↓ ↓ ↓ ADD NEW COMMENT TO BOOK ↓ ↓ ↓ 
    .post(function(req, res){
      let bookid = req.params.id;
      let comment = req.body.comment;
      // IF NO COMMENT IS SENT:
      if(!comment){
        res.send("missing required field comment"); return
      }
      // LOOK FOR BOOK
      Book.findById(bookid)
        .then( book => {
          book.commentcount++;
          book.comments.push(comment);
          book.save()
            .then( updatedBook => {
              res.json({"_id": bookid, "title": updatedBook.title, "comments": updatedBook.comments})
            })
            .catch( err => {console.log(err)} )
        })
        // IF BOOK NOT FOUND
        .catch( err => {
          res.send("no book exists")
        })
    })
    // ↑ ↑ ↑ ADD NEW COMMENT TO BOOK ↑ ↑ ↑ 
    // ------------------------
    // ↓ ↓ ↓ DELETE BOOK ↓ ↓ ↓ 
    .delete(function(req, res){
      let bookid = req.params.id;
      Book.findByIdAndDelete(bookid)
        .then( deletion => {
          if(deletion){
            res.send("delete successful")
          }else{
            res.send("no book exists")
          }
        })
        .catch( err => {
          res.send("no book exists")
        })
    });
    // ↑ ↑ ↑ DELETE BOOK ↑ ↑ ↑ 
};
