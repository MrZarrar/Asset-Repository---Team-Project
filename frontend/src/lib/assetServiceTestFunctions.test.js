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

});

describe("Using GET Requests to fetch assets from pocketbase", () => {

  test('Test 1', () => {
    expect(assetTestFunc.pocketbaseAPICall('http://127.0.0.1:8090/api/collections/Assets/records?page=1&perPage=500&skipTotal=1&filter=(version%3D%2233.4.5-jre%22%20%26%26%20add_type!%3D%22copied%22)&sort=-created')).resolves.toMatchObject({ 'items': [{ 'add_type': 'original', 'category': '', 'collectionId': 'pbc_1231947254', 'collectionName': 'Assets', 'created': '2025-03-25 15:20:39.464Z', 'date_created': '2025-03-25 00:00:00.000Z', 'date_updated': '2025-03-25 00:00:00.000Z', 'file': 'guava_gwt_33_4_y2l8n48tmo.5-jre.jar', 'id': 'mrlc1ykv6ftv2v7', 'license_info': '', 'logo': 'google_logo_icon_gsuite_hd_701751694791470gzbayltphh_advrewdbmu.png', 'name': 'Guava GWT Libraries', 'owner_id': '', 'size': 0, 'type': 'maven', 'updated': '2025-03-31 22:38:54.256Z', 'usage_info': 'Use this asset in your Maven or Gradle project. Copy the appropriate dependency configuration from the section below.', 'version': '33.4.5-jre' }], 'page': 1, 'perPage': 500, 'totalItems': -1, 'totalPages': -1 });
  });

  test('Test 2', () => {
    expect(assetTestFunc.pocketbaseAPICall('http://127.0.0.1:8090/api/collections/Assets/records?page=1&perPage=500&skipTotal=1&filter=(type%3D%22maven%22%20%26%26%20add_type%21%3D%22copied%22)&sort=-created')).resolves.toMatchObject({
      'items': [
        {
          'add_type': 'original',
          'category': '',
          'collectionId': 'pbc_1231947254',
          'collectionName': 'Assets',
          'created': '2025-03-25 15:20:39.464Z',
          'date_created': '2025-03-25 00:00:00.000Z',
          'date_updated': '2025-03-25 00:00:00.000Z',
          'file': 'guava_gwt_33_4_y2l8n48tmo.5-jre.jar',
          'id': 'mrlc1ykv6ftv2v7',
          'license_info': '',
          'logo': 'google_logo_icon_gsuite_hd_701751694791470gzbayltphh_advrewdbmu.png',
          'name': 'Guava GWT Libraries',
          'owner_id': '',
          'size': 0,
          'type': 'maven',
          'updated': '2025-03-31 22:38:54.256Z',
          'usage_info': 'Use this asset in your Maven or Gradle project. Copy the appropriate dependency configuration from the section below.',
          'version': '33.4.5-jre'
        },
        {
          'add_type': 'original',
          'category': '',
          'collectionId': 'pbc_1231947254',
          'collectionName': 'Assets',
          'created': '2025-03-25 14:26:37.458Z',
          'date_created': '2025-03-25 00:00:00.000Z',
          'date_updated': '2025-03-25 00:00:00.000Z',
          'file': 'spring_boot_starter_test_3_4_a75ctqt4f6.4.jar',
          'id': '7oz44fip8sk0mvn',
          'license_info': '',
          'logo': 'spring_boot_j984rhe7dz.svg.png',
          'name': 'spring-boot-starter-test',
          'owner_id': '',
          'size': 0,
          'type': 'maven',
          'updated': '2025-03-31 18:16:15.032Z',
          'usage_info': 'Use this asset in your Maven or Gradle project. Copy the appropriate dependency configuration from the section below.',
          'version': '3.4.4'
        },
        {
          'add_type': 'original',
          'category': '',
          'collectionId': 'pbc_1231947254',
          'collectionName': 'Assets',
          'created': '2025-03-25 08:10:07.029Z',
          'date_created': '2025-03-25 00:00:00.000Z',
          'date_updated': '2025-03-25 00:00:00.000Z',
          'file': '',
          'id': 'jb9iuf65o5r443i',
          'license_info': '',
          'logo': 'spring_boot_psyuk0bu4q.svg.png',
          'name': 'spring',
          'owner_id': '',
          'size': 0,
          'type': 'maven',
          'updated': '2025-03-31 18:16:52.045Z',
          'usage_info': 'Use this asset in your Maven or Gradle project. Copy the appropriate dependency configuration from the section below.',
          'version': '0.12.5'
        },
        {
          'add_type': 'original',
          'category': '',
          'collectionId': 'pbc_1231947254',
          'collectionName': 'Assets',
          'created': '2025-03-25 07:27:14.349Z',
          'date_created': '2025-03-25 00:00:00.000Z',
          'date_updated': '2025-03-25 00:00:00.000Z',
          'file': 'engagelab_5_0_31nv74jvpk.0.pom',
          'id': '9z5ddp118kza6ib',
          'license_info': '',
          'logo': 'png_clipart_huawei_mate_9_logo_smartphone_electronics_mobile_phones_ptcst38iwa.png',
          'name': 'huawei',
          'owner_id': '',
          'size': 0,
          'type': 'maven',
          'updated': '2025-03-31 18:16:23.519Z',
          'usage_info': 'Use this asset in your Maven or Gradle project. Copy the appropriate dependency configuration from the section below.',
          'version': '5.0.0'
        },
        {
          'add_type': 'original',
          'category': '',
          'collectionId': 'pbc_1231947254',
          'collectionName': 'Assets',
          'created': '2025-03-25 07:06:43.152Z',
          'date_created': '2025-03-25 00:00:00.000Z',
          'date_updated': '2025-03-25 00:00:00.000Z',
          'file': 'maven_core_4_0_h05mcw5mxj.0-rc-3.jar',
          'id': 'a8w24ffih0p0a47',
          'license_info': '',
          'logo': 'png_clipart_apache_maven_feathers_tech_companies_1ec0dxhm7v.png',
          'name': 'maven',
          'owner_id': '',
          'size': 0,
          'type': 'maven',
          'updated': '2025-04-01 12:43:16.844Z',
          'usage_info': 'Use this dependency in your Maven or Gradle project. Copy the appropriate dependency configuration from the section below.',
          'version': '4.0.0-rc-3'
        },
        {
          'add_type': 'original',
          'category': '',
          'collectionId': 'pbc_1231947254',
          'collectionName': 'Assets',
          'created': '2025-03-25 06:28:15.472Z',
          'date_created': '2025-03-25 00:00:00.000Z',
          'date_updated': '2025-03-25 00:00:00.000Z',
          'file': '',
          'id': 'ih9j759zy728u6k',
          'license_info': '',
          'logo': 'google_logo_icon_gsuite_hd_701751694791470gzbayltphh_1432ieayln.png',
          'name': 'google-cloud-bom',
          'owner_id': '',
          'size': 0,
          'type': 'maven',
          'updated': '2025-03-31 18:16:34.392Z',
          'usage_info': 'Use this asset in your Maven or Gradle project. Copy the appropriate dependency configuration from the section below.',
          'version': '0.238.0'
        }
      ]
    });
  });

  test('Test 3', () => {
    expect(assetTestFunc.pocketbaseAPICall('http://127.0.0.1:8090/api/collections/Assets/records?page=1&perPage=500&skipTotal=1&filter=(id%3D%22f6z7t7146173yt0%22%20%26%26%20add_type%21%3D%22copied%22)&sort=-created')).resolves.toMatchObject({"items":[],"page":1,"perPage":500,"totalItems":-1,"totalPages":-1});
  }); 

});
