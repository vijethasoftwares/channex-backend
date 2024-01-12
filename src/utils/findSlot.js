module.exports.findSlot = function (a, slot) {
    if (((new Date(slot.from).getTime()) > (new Date(a.availableFrom).getTime())) && ((new Date(slot.to).getTime()) < (new Date(a.availableTo).getTime()))) {
        console.log('test passed')
        let date = new Date(new Date(slot.from).getTime() - 24 * 60 * 60 * 1000);
        let fromDate = new Date(new Date(slot.to).getTime() + 24 * 60 * 60 * 1000);
        let dates = [{ availableFrom: a.availableFrom, availableTo: date }, { availableFrom: fromDate, availableTo: a.availableTo }]
        return dates
    }
    else {
        return [{ availableFrom: a.availableFrom, availableTo: a.availableTo }]
    }
}

module.exports.slotFound = function (from, to, room) {
    let availableDates = room.available;
    for (let i = 0; i < availableDates.length; i++) {
        console.log(((new Date(from).getTime()) > (new Date(availableDates[i].availableFrom).getTime())) , ((new Date(to).getTime()) < (new Date(availableDates[i].availableTo).getTime())), 'frome', 'toe')
        if (((new Date(from).getTime()) > (new Date(availableDates[i].availableFrom).getTime())) && ((new Date(to).getTime()) < (new Date(availableDates[i].availableTo).getTime()))) {
            return true;
        }
    }
    return false;
}