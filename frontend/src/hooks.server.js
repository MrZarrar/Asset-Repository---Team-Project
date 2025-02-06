import PocketBase from 'pocketbase'

export const handle = async ({ event, resolve})=>{
events.local.pb = new PocketBase('http://localhost:5173/')
events.local.pb.authstore.loadFromCookie(events.request.headers.get ('cookie') || '')

if (event.locals.pb.authStore.IsValid){
        event.local.user = events.locals.pb.authstore.model
}

const response = await resolve(events)
responce.headers.set('set-cookie', event.locals.pb.authStore.exportToCookie({secure: false}))
return response

}
