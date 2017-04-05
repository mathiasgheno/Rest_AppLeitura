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
var porta = 7002;

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


app.use(bodyParser.urlencoded({extended:true}));
//app.use(bodyParser.urlencoded());

app.set('view engine', 'ejs');

app.use(bodyParser.json());

// LIVROS

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

// Adicionar um livro no banco, Body Raw JSON!
app.post('/livro', function (req, res) {

    var meuLivro = req.body;

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

// Listagem de livros Por Universidade
app.get('/livros/:universidade', function (req, res) {
    mongoClient.connect('mongodb://localhost:27017/app_livros', function (err, db) {
        if(err){
            res.status(500).send('ocorreu um erro de conexão: ' + err);
            winston.error('ocorreu um erro de conexão', {erro: err});
        }
        else{
            db.collection('questao').aggregate([
                {$match: {universidade: {'$regex' : '^' + req.params.universidade +'$', '$options' : 'i'} }},
                {$group: {_id : "$livro", qtdd_Questoes: { $sum: 1 }}}
            ]).toArray(function(err, docs) {

                if(err){
                    winston.error('ocorreu um erro de busca', {erro: err});
                    res.status(500).send('erro de busca' + err);
                }
                if(docs.length == 0){
                    winston.error('ocorreu um erro de busca', {erro: 'Nenhum resultado'});
                    res.status(500).send('Erro de busca: ' + 'Nenhum resultado encontrado');
                }
                var arrayTest = new Array();

                for(var i = 0; i< docs.length; i++){
                    var numero = i;
                    db.collection('livro').findOne({'titulo': {'$regex' : '^'+ docs[i]._id +'$', '$options' : 'i'} }, function (err, resultado) {
                        if(resultado != null){
                            docs[numero].idLivro = resultado._id;
                            res.status(201).json(docs);
                        }
                    });
                }
            });
        }
    });
});


//QUESTOES

// Questões de um livro agrupado por universidade
app.get('/questoes/livro/:livro', function (req, res) {
    mongoClient.connect('mongodb://localhost:27017/app_livros', function (err, db) {
        if(err){
            winston.error('ocorreu um erro de conexão ', {erro:err});
            res.status(500).send('ocorreu um erro de conexão: ' + err);
        } else {

            var query = [
                {$match: {livro:{'$regex' : '^'+ req.params.livro +'$', '$options' : 'i'}}},
                {$group: {_id : "$universidade", qtdd_Questoes: { $sum: 1 }, questoes: {$addToSet: {
                    questao: "$questao",
                    alternativas: "$alternativas",
                    resposta: "$resposta"
                }}}}
            ];

            db.collection('questao').aggregate(query).toArray(function (err, docs) {
                if(err){
                    winston.error('ocorreu um erro de busca: ', {erro:err});
                    res.status(500).send('erro de busca' + err);
                }
                res.status(201).json(docs);
            });
        }
    });
});

// Adicionar uma questao no banco
app.post('/questao',function (req, res) {
   // res.send('está funcionando');

    var questao = req.body;

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

// listagem de UNIVERSIDADES
app.get('/universidades', function (req, res) {
    mongoClient.connect('mongodb://localhost:27017/app_livros', function (err, db) {
        if(err){
            winston.error('ocorreu um erro de conexão ', {erro:err});
            res.status(500).send('ocorreu um erro de conexão: ' + err);
        } else {
            db.collection('questao').aggregate([{
                $group: {_id : "$universidade", qnt_questoes: { $sum: 1 }}
            }]).toArray(function (err, docs) {
                if(err){
                    winston.error('ocorreu um erro de busca: ', {erro:err});
                    res.status(500).send('erro de busca' + err);
                }
                res.status(201).json(docs);
                console.log('dados da query: ' + docs);
            });
        }
    });
});

// QUESTOES POR LIVRO E POR UNIVERSIDADE


app.get('/', function (req, res) {
   res.render('../views/home.ejs');
});

app.listen(porta, function () {
    console.log('servidor rodando na porta ' + porta);
});

/*

 curl http://localhost:7001/meupost -X POST -v -H "Content-type: application/json" -d '{"nome":"mathias"}'; echo

 curl http://localhost:5001/pagamentos/pagamento -X POST -v -H "Content-type: application/json" -d @arquivo.json; echo


 */