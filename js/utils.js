function getKeyByValue(object, value) {
    for (key in object) {
        if (object.hasOwnProperty(key)) {
            for (key2 in object[key]) {
                if (object[key].hasOwnProperty(key2)) {
                    if (object[key][key2] == value) return key2;
                }
            }
        }
    }

}

function biasedRandom(bias, degree) {
    console.log("calling " + bias + "with " + degree + " probablilty")
    if (!Array.isArray(bias)) {
        let temp = bias;
        bias = []
        bias.push(temp);
    }
    let rand = Math.random().toFixed(2);
    if (rand < (degree / 100)) {
        rand = Math.floor(Math.random() * bias.length);
        return bias[rand];
    } else {
        rand = Math.ceil(Math.random() * 6);
        return rand;
    }
}
module.exports = {
    getKeyByValue,
    biasedRandom
}