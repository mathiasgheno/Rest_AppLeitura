/**
 * Created by mathi on 20/03/2017.
 */
var app = require('express')();
var bodyParser = require('body-parser');
var mongoClient = require('mongodb').MongoClient;
var objectId = require('mongodb').ObjectID;
var winston = require('winston');

var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.File)({ filename: 'somefile.log' })
    ]
});

logger.warn('primeiro teste com o winston');

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

app.get('/livro/:id', function (req, res) {
    var id = new objectId(req.params.id);

    mongoClient.connect('mongodb://localhost:27017/app_livros', function (err, db) {
        if(err){
            res.status(500).send('ocorreu um erro de conexão: ' + err);
            winston.error('ocorreu um erro de conexão', {erro: err});
        }
        else{
            db.collection('livro').findOne({'_id':id}, function (err, resultado) {
               if(err){
                   winston.error('ocorreu um erro de busca', {erro: err});
                   res.status(500).send('erro de busca' + err);
               }
               if(resultado == null)
                   res.status(500).send('Erro de busca, nenhum dado encontrado.');
               else{
                   res.status(201).json(resultado);
               }

            });
        }
    });
});

app.get('/livros', function (req, res) {
    var id = new objectId(req.params.id);

    mongoClient.connect('mongodb://localhost:27017/app_livros', function (err, db) {
        if(err){
            res.status(500).send('ocorreu um erro de conexão: ' + err);
            winston.error('ocorreu um erro de conexão', {erro: err});
        }
        else{
            db.collection('livro').find({}).toArray(function(err, docs) {
                if(err){
                    winston.error('ocorreu um erro de busca', {erro: err});
                    res.status(500).send('erro de busca' + err);
                }
                res.status(201).json(docs);
            });
        }
    });
});

app.delete('/livro/:id', function (req, res) {
    var id = new objectId(req.params.id);

    mongoClient.connect('mongodb://localhost:27017/app_livros', function (err, db) {
        if(err){
            res.status(500).send('ocorreu um erro de conexão: ' + err);
            winston.error('ocorreu um erro de conexão', {erro: err});
        }
        else{
            db.collection('livro').deleteOne({'_id':id}, function (err, resultado) {
                if(err){
                    winston.error('ocorreu um erro de busca', {erro: err});
                    res.status(500).send('erro de busca' + err);
                }
                if(resultado == null)
                    res.status(500).send('Erro de exclusao, seu dado nao foi encontrado.');
                else{
                    res.status(201).json(resultado);
                }
            });
        }
    });
});

app.post('/livro', function (req, res) {


    var meuLivro = {
        'nome':'centauro no jardim',
        'autor':'moacyr scliar',
        'obrigatoria':'ufrgs'
    };

    mongoClient.connect('mongodb://localhost:27017/app_livros', function (err, db) {
        if(err){
            res.status(500).send('ocorreu um erro de conexão: ' + err);
            winston.error('ocorreu um erro de conexão', {erro: err});
        }
        else{
            db.collection('livro').insertOne(meuLivro, function (err) {
                if(err){
                    winston.error('ocorreu um erro de insercao', {erro: err});
                    res.status(500).send('erro de busca' + err);
                }
                else{

                    var response = {
                        dados_inseridos: meuLivro,
                        links: [
                            {
                                href:'http://localhost:7001/livro/' + meuLivro._id,
                                rel: 'DADOS',
                                method: 'GET'
                            },
                            {
                                href:'http://localhost:7001/livro/' + meuLivro._id,
                                rel: 'EXCLUIR',
                                method: 'DELETE'
                            }
                        ]
                    };

                    res.status(201).json(response);
                }
            });
        }
    });

});

app.listen(7002, function () {
    console.log('servidor rodando na porta 7002');
});

