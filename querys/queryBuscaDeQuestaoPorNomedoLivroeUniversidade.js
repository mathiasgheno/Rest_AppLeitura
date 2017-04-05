db.questao.find({
    livro:{'$regex' : '^a hora da estrela$', '$options' : 'i'}, 
    universidade:{'$regex' : '^puc-sp$', '$options' : 'i'}
})