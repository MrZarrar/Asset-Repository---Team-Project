/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1231947254")

  // add field
  collection.fields.addAt(13, new Field({
    "cascadeDelete": false,
    "collectionId": "_pb_users_auth_",
    "hidden": false,
    "id": "relation2117886457",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "owner_id",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(14, new Field({
    "hidden": false,
    "id": "select2183563993",
    "maxSelect": 1,
    "name": "add_type",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "original",
      "added",
      "copied"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1231947254")

  // remove field
  collection.fields.removeById("relation2117886457")

  // remove field
  collection.fields.removeById("select2183563993")

  return app.save(collection)
})
