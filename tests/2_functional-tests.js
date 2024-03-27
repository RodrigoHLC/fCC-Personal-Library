const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);
const mocha = require('mocha'); // MY CODE
const before = mocha.before; // MY CODE - UNUSED

suite('Functional Tests', function() {

  suite('Routing tests', function() {

    // CREATE _id VARIABLE FOR LATER TESTS
    let _id;
    suite('POST /api/books with title => create book object/expect book object', function() {
      
      test('Test POST /api/books with title', function(done) {
        chai
          .request(server)
          .keepOpen()
          .post("/api/books")
          .send({
            title: "El señor de los anillos"
          })
          .end((err, res) => {
            if(err){console.log(err)};
            assert.equal(res.status, 200, "Status !== 200");
            assert.isObject(res.body, 'response should be an object');
            assert.equal(res.body.title, "El señor de los anillos", "title should match title sent");
            assert.property(res.body, "_id", "_id should exist");
            // SET _id TO THE _id OF THIS BOOK
            _id = res.body._id;
            done()
          })
      });
      
      test('Test POST /api/books with no title given', function(done) {
        chai
          .request(server)
          .keepOpen()
          .post("/api/books")
          .send({})
          .end((err, res) => {
            if(err){console.log(err)};
            assert.equal(res.status, 200, "Status !== 200");
            assert.equal(res.text, "missing required field title", "should read 'missing required field title'");
            done()
          })
      });
      
    });


    suite('GET /api/books => array of books', function(){
      
      test('Test GET /api/books',  function(done){
        chai
          .request(server)
          .keepOpen()
          .get("/api/books")
          .end((err, res) => {
            if(err){console.log(err)};
            assert.equal(res.status, 200);
            assert.isArray(res.body, "should return an array");
            assert.isObject(res.body[0], "first item in array should be an object");
            assert.equal(res.body.every( book => book._id), true, "every item should be an object with an '_id' key");
            assert.equal(res.body.every( book => book.title), true, "every item should be an object with a 'title' key");
            assert.equal(res.body.every( book => book.hasOwnProperty("commentcount")), true, "every item should be an object with a 'commentcount' key");
            done()
          })
      });      
    });

    suite('GET /api/books/[id] => book object with [id]', function(){
      
      test('Test GET /api/books/[id] with id not in db',  function(done){
        chai
          .request(server)
          .keepOpen()
          .get("/api/books/invalidId")
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, "no book exists", "should return 'no book exists'")
            done()
          })
      });

      test('Test GET /api/books/[id] with valid id in db',  function(done){
        chai
          .request(server)
          .keepOpen()
          .get(`/api/books/${_id}`)
          .end( (err, res) => {
            assert.equal(res.status, 200);
            assert.isObject(res.body);
            assert.equal(res.body._id, _id);
            assert.equal(res.body.title, "El señor de los anillos");
            assert.property(res.body, "comments");
            assert.isArray(res.body.comments);
            done()
          })
      });
    });

    suite('POST /api/books/[id] => add comment/expect book object with id', function(){
      
      // DECLARE A VARIABLE FOR ARRAY'S LENGTH PRIOR TO POSTING
      let oldLength;

      test('Test POST /api/books/[id] with comment', function(done){
        // GET comments ARRAY'S LENGTH PRIOR TO POSTING
        chai
            .request(server)
            .keepOpen()
            .get(`/api/books/${_id}`)
            .end((err, res)=>{
              if(err){console.log}
              // GET ARRAY'S LENGTH
              oldLength = res.body.comments.length;
            // NOW ADD COMMENT
            chai
              .request(server)
              .keepOpen()
              .post(`/api/books/${_id}`)
              .send({
                _id: _id,
                comment: "Test comment"
              })
              .end( (err, res) => {
                assert.equal(res.status, 200);
                assert.isObject(res.body, "should be an object");
                assert.equal(res.body._id, _id, "_id should match");
                assert.equal(res.body.title, "El señor de los anillos", "title should match");
                // ENSURE ARRAY LENGTH IS NOW LONGER
                assert.isAbove(res.body.comments.length, oldLength, "array should have become longer");
                assert.include(res.body.comments, "Test comment", "comment should be included");
                done()
              })
            })
        
      });

      test('Test POST /api/books/[id] without comment field', function(done){
        chai
          .request(server)
          .keepOpen()
          .post(`/api/books/${_id}`)
          .send({_id: _id})
          .end( (err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, "missing required field comment");
            done()
          })
      });

      test('Test POST /api/books/[id] with comment, id not in db', function(done){
        chai
          .request(server)
          .keepOpen()
          .post(`/api/books/invalidId`)
          .send({
            _id: "invalidId",
            comment: "Test comment here"
          })
          .end( (err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, "no book exists");
            done()
          })
      });
      
    });

    suite('DELETE /api/books/[id] => delete book object id', function() {

      test('Test DELETE /api/books/[id] with valid id in db', function(done){
        chai
          .request(server)
          .keepOpen()
          .delete(`/api/books/${_id}`)
          .end( (err, res) => {
            if(err){console.log(err)};
            assert.equal(res.status, 200, "Status not == 200");
            assert.isNotObject(res.text, "response should not be an object");
            assert.equal(res.text, "delete successful", "incorrect text response");
            done()
          })
      });

      test('Test DELETE /api/books/[id] with  id not in db', function(done){
        chai
          .request(server)
          .keepOpen()
          .delete("/api/books/invalidId")
          .end( (err ,res) => {
            if(err){console.log(err)};
            assert.equal(res.status, 200, "Status not == 200");
            assert.equal(res.text, "no book exists", "incorrect response msg");
            done()
          })
      });

    });

  });

});
