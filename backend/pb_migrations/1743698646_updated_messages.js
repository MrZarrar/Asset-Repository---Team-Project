/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2605467279")

  // add field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "number2892185779",
    "max": null,
    "min": null,
    "name": "like",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "number4265340074",
    "max": null,
    "min": null,
    "name": "dislike",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2605467279")

  // remove field
  collection.fields.removeById("number2892185779")

  // remove field
  collection.fields.removeById("number4265340074")

  return app.save(collection)
})
