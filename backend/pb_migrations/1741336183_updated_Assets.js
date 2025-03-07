/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1231947254")

  // add field
  collection.fields.addAt(10, new Field({
    "hidden": false,
    "id": "date2346364997",
    "max": "",
    "min": "",
    "name": "date_created",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(11, new Field({
    "hidden": false,
    "id": "date4286353674",
    "max": "",
    "min": "",
    "name": "date_updated",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1231947254")

  // remove field
  collection.fields.removeById("date2346364997")

  // remove field
  collection.fields.removeById("date4286353674")

  return app.save(collection)
})
