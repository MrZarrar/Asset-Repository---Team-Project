const stringBuilder = require('./assetServiceTestFunctions');

describe("Testing Filter Array to string for a GET request", () => {

  test('Test 1', () => {
    expect(stringBuilder({ id: "f6z7t7146173yt0" })).toBe('(id="f6z7t7146173yt0" && add_type!="copied")');
  });

  test('Test 2', () => {
    expect(stringBuilder({ type:"maven" })).toBe('(type="maven" && add_type!="copied")');
  });

  test('Test 3', () => {
    expect(stringBuilder({ version:"33.4.5-jre" })).toBe('(version="33.4.5-jre" && add_type!="copied")');
  });

  test('Test 4', () => {
    expect(stringBuilder({})).toBe('(add_type!="copied")');
  });

  test('Test 5', () => {
    expect(stringBuilder({type:"maven", name:"google-cloud-bom"})).toBe('(type="maven" && name="google-cloud-bom" && add_type!="copied")');
  });

  test('Test 6', () => {
    expect(stringBuilder({type:"maven", name:"spring-boot-starter-test", version:"3.4.4"})).toBe('(type="maven" && name="spring-boot-starter-test" && version="3.4.4" && add_type!="copied")');
  });

})

