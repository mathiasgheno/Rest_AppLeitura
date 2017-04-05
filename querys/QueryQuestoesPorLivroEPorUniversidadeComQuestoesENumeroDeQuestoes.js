// listagem de questoes por livro agrupado por universidades
db.questao.aggregate([
    {$match: {livro:{'$regex' : '^a hora da estrela$', '$options' : 'i'}}},
    {$group: {_id : "$universidade", qtdd_Questoes: { $sum: 1 }, questoes: {$addToSet: {
        questao: "$questao", 
        alternativas: "$alternativas", 
        resposta: "$resposta"
    }}}} 
    ]
);