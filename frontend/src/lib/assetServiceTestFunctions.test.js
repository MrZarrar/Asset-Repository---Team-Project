const assetTestFunc = require('./assetServiceTestFunctions');

describe("Testing Filter Array to string for a GET request", () => {

  test('Test 1', () => {
    expect(assetTestFunc.stringBuilder({ id: "f6z7t7146173yt0" })).toBe('(id="f6z7t7146173yt0" && add_type!="copied")');
  });

  test('Test 2', () => {
    expect(assetTestFunc.stringBuilder({ type:"maven" })).toBe('(type="maven" && add_type!="copied")');
  });

  test('Test 3', () => {
    expect(assetTestFunc.stringBuilder({ version:"33.4.5-jre" })).toBe('(version="33.4.5-jre" && add_type!="copied")');
  });

  test('Test 4', () => {
    expect(assetTestFunc.stringBuilder({})).toBe('(add_type!="copied")');
  });

  test('Test 5', () => {
    expect(assetTestFunc.stringBuilder({type:"maven", name:"google-cloud-bom"})).toBe('(type="maven" && name="google-cloud-bom" && add_type!="copied")');
  });

  test('Test 6', () => {
    expect(assetTestFunc.stringBuilder({type:"maven", name:"spring-boot-starter-test", version:"3.4.4"})).toBe('(type="maven" && name="spring-boot-starter-test" && version="3.4.4" && add_type!="copied")');
  });

  test('Test 7', () => {
    expect(assetTestFunc.pocketbaseAPICall('http://127.0.0.1:8090/api/collections/Assets/records?page=1&perPage=500&skipTotal=1&filter=(version%3D%2233.4.5-jre%22%20%26%26%20add_type!%3D%22copied%22)&sort=-created')).resolves.toEqual({ "items": [{ "add_type": "original", "category": "", "collectionId": "pbc_1231947254", "collectionName": "Assets", "created": "2025-03-25 15:20:39.464Z", "date_created": "2025-03-25 00:00:00.000Z", "date_updated": "2025-03-25 00:00:00.000Z", "file": "guava_gwt_33_4_y2l8n48tmo.5-jre.jar", "id": "mrlc1ykv6ftv2v7", "license_info": "", "logo": "google_logo_icon_gsuite_hd_701751694791470gzbayltphh_advrewdbmu.png", "name": "Guava GWT Libraries", "owner_id": "", "size": 0, "type": "maven", "updated": "2025-03-31 22:38:54.256Z", "usage_info": "Use this asset in your Maven or Gradle project. Copy the appropriate dependency configuration from the section below.", "version": "33.4.5-jre" }], "page": 1, "perPage": 500, "totalItems": -1, "totalPages": -1 });
  });
});
