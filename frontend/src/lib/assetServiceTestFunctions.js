function stringBuilder(filters = {}) {

let filterString = ''; // initalises an empty string to hold all the filters
  filterString += '(' // forces ALL filters to be put into brackets, allowing for multiple filters and single filters to all work without special code
    Object.entries(filters).forEach(([key, value]) => { // for each value in the JSON filters input, it will format it into a string to be sent with the GET command
      if (value) {
        filterString += `${key}="${value}" && `;
      }
    });

    if (filterString) {
      filterString += `add_type!="copied")`; // This makes sure copied assets are ignored, and also has the closing bracket to form a functional GET command
    }
return(filterString);
}

module.exports = stringBuilder;