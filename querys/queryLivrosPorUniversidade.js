// listagem de livros por universidades
db.questao.aggregate([
    {$match: {universidade: {'$regex' : '^fuvest$', '$options' : 'i'} }},
    {$group: {_id : "$livro", qtdd_Questoes: { $sum: 1 }}} 
    ]
);