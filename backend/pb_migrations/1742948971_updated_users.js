/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // update collection data
  unmarshal({
    "manageRule": "@request.auth.role = \"user\" || @request.auth.role = \"admin\""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // update collection data
  unmarshal({
    "manageRule": "@request.auth.id = id && (@request.auth.role = \"user\" || @request.auth.role = \"admin\")"
  }, collection)

  return app.save(collection)
})
