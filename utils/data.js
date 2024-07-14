const filter = (array, field, value, first = false) => {
	const filteredArray = array.filter((element) => {
		return element[field] === value;
	});

	return first ? (filteredArray.length > 0 ? filteredArray[0] : null) : filteredArray;
};

const update = (array, conditionField, conditionValue, updatedElement, first = false) => {
	let done = false;
	const updatedArray = array.map((element) => {
		if (!done && element[conditionField] === conditionValue) {
			return updatedElement;
		}

		return element;
	});

	return updatedArray;
};

module.exports = {
	filter,
	update,
};
