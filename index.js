/**
 * Created by mathi on 20/03/2017.
 */
var app = require('express')();
var bodyParser = require('body-parser');
var mongoClient = require('mongodb').MongoClient;
var objectId = require('mongodb').ObjectID;
var winston = require('winston');
var bb = require('express-busboy-custom');
var fs = require('fs');
var ejs = require('ejs');

var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.File)({ filename: 'somefile.log' })
    ]
});

var dadosLog ={
    data: new Date(),
    computer: require('os').hostname()
};

logger.warn('Servidor Inicializado', dadosLog);

bb.extend(app, {
    upload: true,
        path: '/uploads',
        allowedPath: /./
});

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.urlencoded());

app.set('view engine', 'ejs');

//app.use(bodyParser.json());

// Livros

//Pegar um livro pelo ID
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

// Pegar todos os livros
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

// Deletar um arquivo pelo ID
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

// Adicionar um livro no banco
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

//Questões

// Adicionar uma questao no banco
app.post('/questao',function (req, res) {
   // res.send('está funcionando');

    var questao = {
        'questao':'Qual o nome do autor do livro O Centauro No Jardin',
        'alternativas':[
            'A) - ',
            'B) - ',
            'C) - ',
            'D) - ',
            'E) - '
        ],
        'resposta':'A'
    };

    mongoClient.connect('mongodb://localhost:27017/app_livros', function (err, db) {
        if(err){
            res.status(500).send('ocorreu um erro de conexão: ' + err);
            winston.error('ocorreu um erro de conexão', {erro: err});
        }
        else{
            db.collection('questao').insertOne(questao, function (err) {
                if(err){
                    winston.error('ocorreu um erro de insercao', {erro: err});
                    res.status(500).send('erro de busca' + err);
                }
                else{

                    var response = {
                        dados_inseridos: questao,
                        links: [
                            {
                                href:'http://localhost:7001/questao/' + questao._id,
                                rel: 'DADOS',
                                method: 'GET'
                            },
                            {
                                href:'http://localhost:7001/questao/' + questao._id,
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

//Pegar todos as questões
app.get('/questoes', function (req, res) {
   mongoClient.connect('mongodb://localhost:27017/app_livros', function (err, db) {
       if(err){
           winston.error('ocorreu um erro de conexão ', {erro:err});
           res.status(500).send('ocorreu um erro de conexão: ' + err);
       } else {
           db.collection('questao').find({}).toArray(function (err, docs) {
               if(err){
                   winston.error('ocorreu um erro de busca: ', {erro:err});
                   res.status(500).send('erro de busca' + err);
               }
               res.status(201).json(docs);
           });
       }
   });
});

//Pegar uma questão por ID
app.get('/questao/:id', function (req, res){
    var id = new objectId(req.params.id);

    mongoClient.connect('mongodb://localhost:27017/app_livros', function (err, db) {
        if(err){
            res.status(500).send('ocorreu um erro de conexão: ' + err);
            winston.error('ocorreu um erro de conexão', {erro: err});
        }
        else{
            db.collection('questao').findOne({'_id':id}, function (err, resultado) {
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

// Deletar um questão por ID
app.delete('/questao/:id', function (req, res) {
    var id = new objectId(req.params.id);

    mongoClient.connect('mongodb://localhost:27017/app_livros', function (err, db) {
        if(err){
            res.status(500).send('ocorreu um erro de conexão: ' + err);
            winston.error('ocorreu um erro de conexão', {erro: err});
        }
        else{
            db.collection('questao').deleteOne({'_id':id}, function (err, resultado) {
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

// testizinho
app.post('/meupost', function (req, res) {
    var valor = req.body.nome;
    var arquivo = req.file;
    console.log('objeto: ' + JSON.stringify(valor, 4));
    console.log('arquivos: ' + JSON.stringify(arquivo,null, 4));

    // fs.readFile(req.files.displayImage.path, function (err, data) {
    //     // ...
    //     var newPath = __dirname + "/uploads/uploadedFileName";
    //     fs.writeFile(newPath, data, function (err) {
    //         res.redirect("back");
    //     });
    // });

    //console.log('nome ' + valor);
    //res.status(201).send('Opaaa, vamos que vamos: ' + 'oiiii');
    res.send('funcionou o/');
});

app.get('/', function (req, res) {
   res.render('../views/home.ejs');
});

app.listen(7001, function () {
    console.log('servidor rodando na porta 7001');
});

/*

 curl http://localhost:7001/meupost -X POST -v -H "Content-type: application/json" -d '{"nome":"mathias"}'; echo

 curl http://localhost:5001/pagamentos/pagamento -X POST -v -H "Content-type: application/json" -d @arquivo.json; echo


 */