db.questao.aggregate({
    $group: {_id : "$universidade", count: { $sum: 1 }}
});