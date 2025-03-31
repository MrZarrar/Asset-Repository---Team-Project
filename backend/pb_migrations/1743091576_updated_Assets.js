/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1231947254")

  // remove field
  collection.fields.removeById("json1145142227")

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1231947254")

  // add field
  collection.fields.addAt(13, new Field({
    "hidden": false,
    "id": "json1145142227",
    "maxSize": 0,
    "name": "linked_projects",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  return app.save(collection)
})
