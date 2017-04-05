db.livro.find({
    titulo:{'$regex' : '^a hora da estrela$', '$options' : 'i'}
})