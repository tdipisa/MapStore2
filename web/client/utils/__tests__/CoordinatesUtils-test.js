/**
 * Copyright 2015, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
var expect = require('expect');
var CoordinatesUtils = require('../CoordinatesUtils');
var Proj4js = require('proj4');

describe('CoordinatesUtils', () => {
    afterEach((done) => {
        document.body.innerHTML = '';

        setTimeout(done);
    });
    it('convert lat lon to mercator', () => {
        var point = [45, 13];

        var transformed = CoordinatesUtils.reproject(point, 'EPSG:4326', 'EPSG:900913');

        expect(transformed).toExist();
        expect(transformed.x).toExist();
        expect(transformed.y).toExist();
        expect(transformed.srs).toExist();

        expect(transformed.x).toNotBe(45);
        expect(transformed.y).toNotBe(13);
        expect(transformed.srs).toBe('EPSG:900913');
    });
    it('it should tests the creation of a bbox given the center, resolution and size', () => {
        let center = {x: 0, y: 0};
        let resolution = 1;
        let rotation = 0;
        let size = [10, 10];
        let bbox = CoordinatesUtils.getProjectedBBox(center, resolution, rotation, size);
        expect(bbox).toExist();
        expect(bbox.maxx).toBeGreaterThan(bbox.minx);
        expect(bbox.maxy).toBeGreaterThan(bbox.miny);
    });

    it('convert lat lon bbox to marcator bbox', () => {
        var bbox = [44, 12, 45, 13];
        var projbbox = CoordinatesUtils.reprojectBbox(bbox, 'EPSG:4326', 'EPSG:900913');

        expect(projbbox).toExist();
        expect(projbbox.length).toBe(4);
        for (let i = 0; i < 4; i++) {
            expect(projbbox[i]).toNotBe(bbox[i]);
        }
    });
    it('test getAvailableCRS', () => {
        const defs = Object.keys(Proj4js.defs);
        const toCheck = Object.keys(CoordinatesUtils.getAvailableCRS());

        toCheck.forEach(item => {
            expect(defs.indexOf(item) !== -1);
        });
    });
    it('test calculateAzimuth', () => {
        var point1 = [0, 0];
        var point2 = [1, 1];
        var proj = 'EPSG:900913';
        var azimuth = CoordinatesUtils.calculateAzimuth(point1, point2, proj);

        expect(azimuth.toFixed(2)).toBe('45.00');
    });
    it('test normalizeSRS', () => {
        expect(CoordinatesUtils.normalizeSRS('EPSG:900913')).toBe('EPSG:3857');
    });

    it('test normalizeSRS with allowedSRS', () => {
        expect(CoordinatesUtils.normalizeSRS('EPSG:900913', {'EPSG:900913': true})).toBe('EPSG:900913');
    });

    it('test getCompatibleSRS', () => {
        expect(CoordinatesUtils.getCompatibleSRS('EPSG:900913', {'EPSG:900913': true})).toBe('EPSG:900913');
        expect(CoordinatesUtils.getCompatibleSRS('EPSG:900913', {'EPSG:900913': true, 'EPSG:3857': true})).toBe('EPSG:900913');
        expect(CoordinatesUtils.getCompatibleSRS('EPSG:900913', {'EPSG:3857': true})).toBe('EPSG:3857');

        expect(CoordinatesUtils.getCompatibleSRS('EPSG:3857', {'EPSG:900913': true})).toBe('EPSG:900913');
        expect(CoordinatesUtils.getCompatibleSRS('EPSG:3857', {'EPSG:900913': true, 'EPSG:3857': true})).toBe('EPSG:3857');
        expect(CoordinatesUtils.getCompatibleSRS('EPSG:3857', {'EPSG:3857': true})).toBe('EPSG:3857');
    });
    it('test reprojectGeoJson', () => {
        const testPoint = {
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [
                            -112.50042920000001,
                            42.22829164089942
                        ]
                    },
                    properties: {
                        "serial_num": "12C324776"
                    },
                    id: 0
                }
            ]
        };
        const reprojectedTestPoint = CoordinatesUtils.reprojectGeoJson(testPoint, "EPSG:4326", "EPSG:900913");
        expect(reprojectedTestPoint).toExist();
        expect(reprojectedTestPoint.features).toExist();
        expect(reprojectedTestPoint.features[0]).toExist();
        expect(reprojectedTestPoint.features[0].type).toBe("Feature");
        expect(reprojectedTestPoint.features[0].geometry.type).toBe("Point");
        // approximate values should be the same
        expect(reprojectedTestPoint.features[0].geometry.coordinates[0].toFixed(4)).toBe((-12523490.492568726).toFixed(4));
        expect(reprojectedTestPoint.features[0].geometry.coordinates[1].toFixed(4)).toBe((5195238.005360028).toFixed(4));
    });

    it('test geojson extent', () => {
        let geojsonPoint = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [125.6, 10.1]
            },
            "properties": {
                "name": "Dinagat Islands"
            }
        };
        expect(CoordinatesUtils.getGeoJSONExtent(geojsonPoint)[0] <= 125.6).toBe(true);
        expect(CoordinatesUtils.getGeoJSONExtent(geojsonPoint)[1] <= 10.1).toBe(true);
        expect(CoordinatesUtils.getGeoJSONExtent(geojsonPoint)[2] >= 125.6).toBe(true);
        expect(CoordinatesUtils.getGeoJSONExtent(geojsonPoint)[3] >= 10.1).toBe(true);
        let featureCollection = { "type": "FeatureCollection",
            "features": [
                { "type": "Feature",
                    "geometry": {"type": "Point", "coordinates": [102.0, 0.5]},
                    "properties": {"prop0": "value0"}
                },
                { "type": "Feature",
                    "geometry": {
                        "type": "GeometryCollection",
                        "geometries": [{"type": "Point", "coordinates": [102.0, 0.5]}]
                    },
                    "properties": {"prop0": "value0"}
                },
                { "type": "Feature",
                    "geometry": {
                        "type": "LineString",
                        "coordinates": [
                    [102.0, 0.0], [103.0, 1.0], [104.0, 0.0], [105.0, 1.0]
                        ]
                    },
                    "properties": {
                        "prop0": "value0",
                        "prop1": 0.0
                    }
                },
                { "type": "Feature",
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [
                            [ [100.0, 0.0], [101.0, 0.0], [101.0, 1.0],
                       [100.0, 1.0], [100.0, 0.0] ]
                        ]
                    },
                    "properties": {
                        "prop0": "value0",
                        "prop1": {"this": "that"}
                    }
                }
            ]
        };
        expect(CoordinatesUtils.getGeoJSONExtent(featureCollection)[0]).toBe(100.0);
        expect(CoordinatesUtils.getGeoJSONExtent(featureCollection)[1]).toBe(0.0);
        expect(CoordinatesUtils.getGeoJSONExtent(featureCollection)[2]).toBe(105.0);
        expect(CoordinatesUtils.getGeoJSONExtent(featureCollection)[3]).toBe(1.0);
    });
    it('test coordsOLtoLeaflet on point', () => {
        let geojsonPoint = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [125.6, 10.1]
            }
        };
        expect(CoordinatesUtils.coordsOLtoLeaflet(geojsonPoint.geometry)).toBe(geojsonPoint.geometry.coordinates.reverse());
    });
    it('test coordsOLtoLeaflet on LineString', () => {
        let geojsonPoint = {
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": [[1, 2], [3, 4]]
            }
        };
        const reversedPoint = {
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": geojsonPoint.geometry.coordinates.map(point => point.reverse())
            }
        };

        expect(CoordinatesUtils.coordsOLtoLeaflet(geojsonPoint.geometry)[0]).toBe(reversedPoint.geometry.coordinates[0]);
        expect(CoordinatesUtils.coordsOLtoLeaflet(geojsonPoint.geometry)[1]).toBe(reversedPoint.geometry.coordinates[1]);
    });
    it('test coordsOLtoLeaflet on Polygon', () => {
        let geojsonPoint = {
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [[[1, 2], [3, 4], [5, 6], [1, 2]]]
            }
        };
        const reversedPoint = {
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": geojsonPoint.geometry.coordinates[0].map(point => point.reverse())
            }
        };

        expect(CoordinatesUtils.coordsOLtoLeaflet(geojsonPoint.geometry)[0][0]).toBe(reversedPoint.geometry.coordinates[0]);
        expect(CoordinatesUtils.coordsOLtoLeaflet(geojsonPoint.geometry)[0][1]).toBe(reversedPoint.geometry.coordinates[1]);
        expect(CoordinatesUtils.coordsOLtoLeaflet(geojsonPoint.geometry)[0][2]).toBe(reversedPoint.geometry.coordinates[2]);
        expect(CoordinatesUtils.coordsOLtoLeaflet(geojsonPoint.geometry)[0][3]).toBe(reversedPoint.geometry.coordinates[3]);
    });

    it('test getViewportGeometry not listed projection', () => {
        expect(CoordinatesUtils.getViewportGeometry({
            minx: -160,
            miny: -50,
            maxx: 130,
            maxy: 60
        }, 'EPSG:UNKOWN')).toEqual({
            type: 'Polygon',
            radius: 0,
            projection: 'EPSG:UNKOWN',
            coordinates: [ [ [ -160, -50 ], [ -160, 60 ], [ 130, 60 ], [ 130, -50 ], [ -160, -50 ] ] ],
            extent: [-160, -50, 130, 60],
            center: [-15, 5]
        });
    });

    it('test getViewportGeometry projection EPSG:4326', () => {
        expect(CoordinatesUtils.getViewportGeometry({
            minx: -160,
            miny: -50,
            maxx: 130,
            maxy: 60
        }, 'EPSG:4326')).toEqual({
            type: 'Polygon',
            radius: 0,
            projection: 'EPSG:4326',
            coordinates: [ [ [ -160, -50 ], [ -160, 60 ], [ 130, 60 ], [ 130, -50 ], [ -160, -50 ] ] ],
            extent: [-160, -50, 130, 60],
            center: [-15, 5]
        });
    });

    it('test getViewportGeometry projection EPSG:4326 world view', () => {
        expect(CoordinatesUtils.getViewportGeometry({
            minx: -190,
            miny: -50,
            maxx: 230,
            maxy: 60
        }, 'EPSG:4326')).toEqual({
            type: 'Polygon',
            radius: 0,
            projection: 'EPSG:4326',
            coordinates: [ [ [ -180, -50 ], [ -180, 60 ], [ 180, 60 ], [ 180, -50 ], [ -180, -50 ] ] ],
            extent: [-180, -50, 180, 60],
            center: [0, 5]
        });
    });

    it('test getViewportGeometry projection EPSG:4326 on IDL center position > -180', () => {
        expect(CoordinatesUtils.getViewportGeometry({
            minx: -190,
            miny: -50,
            maxx: -160,
            maxy: 60
        }, 'EPSG:4326')).toEqual({
            type: 'MultiPolygon',
            radius: 0,
            projection: 'EPSG:4326',
            coordinates: [
                [[[ -180, -50 ], [ -180, 60 ], [ -160, 60 ], [ -160, -50 ], [ -180, -50 ]]],
                [[[ 170, -50 ], [ 170, 60 ], [ 180, 60 ], [ 180, -50 ], [ 170, -50 ]]]
            ],
            extent: [
                [-180, -50, -160, 60],
                [170, -50, 180, 60]
            ],

            center: [ -175, 5]
        });
    });


    it('test getViewportGeometry projection EPSG:4326 on IDL center position < 180', () => {
        expect(CoordinatesUtils.getViewportGeometry({
            minx: -230,
            miny: -50,
            maxx: -160,
            maxy: 60
        }, 'EPSG:4326')).toEqual({
            type: 'MultiPolygon',
            radius: 0,
            projection: 'EPSG:4326',
            coordinates: [
                [[[ -180, -50 ], [ -180, 60 ], [ -160, 60 ], [ -160, -50 ], [ -180, -50 ]]],
                [[[ 130, -50 ], [ 130, 60 ], [ 180, 60 ], [ 180, -50 ], [ 130, -50 ]]]
            ],
            extent: [
                [-180, -50, -160, 60],
                [130, -50, 180, 60]
            ],
            center: [ 165, 5]
        });

    });

    it('test getViewportGeometry projection EPSG:4326 on IDL center x values < -180', () => {
        expect(CoordinatesUtils.getViewportGeometry({
            minx: -1640,
            miny: -50,
            maxx: -1950,
            maxy: 60
        }, 'EPSG:4326')).toEqual({
            type: 'MultiPolygon',
            radius: 0,
            projection: 'EPSG:4326',
            coordinates: [
                [[[ -180, -50 ], [ -180, 60 ], [ -150, 60 ], [ -150, -50 ], [ -180, -50 ]]],
                [[[ 160, -50 ], [ 160, 60 ], [ 180, 60 ], [ 180, -50 ], [ 160, -50 ]]]
            ],
            extent: [
                [-180, -50, -150, 60],
                [160, -50, 180, 60]
            ],
            center: [ -175, 5]
        });

    });

    it('test getViewportGeometry projection EPSG:4326 on IDL x values > 180', () => {
        expect(CoordinatesUtils.getViewportGeometry({
            minx: 880,
            miny: -50,
            maxx: 930,
            maxy: 60
        }, 'EPSG:4326')).toEqual({
            type: 'MultiPolygon',
            radius: 0,
            projection: 'EPSG:4326',
            coordinates: [
                [[[ -180, -50 ], [ -180, 60 ], [ -150, 60 ], [ -150, -50 ], [ -180, -50 ]]],
                [[[ 160, -50 ], [ 160, 60 ], [ 180, 60 ], [ 180, -50 ], [ 160, -50 ]]]
            ],
            extent: [
                [-180, -50, -150, 60],
                [160, -50, 180, 60]
            ],
            center: [ -175, 5]
        });
    });

    it('test getViewportGeometry projection EPSG:900913', () => {

        expect(CoordinatesUtils.getViewportGeometry({
            minx: -8932736.873518841,
            miny: 1995923.6825825204,
            maxx: -2162250.6561310687,
            maxy: 6584591.364598222
        }, 'EPSG:900913')).toEqual({
            type: 'Polygon',
            radius: 0,
            projection: 'EPSG:900913',
            coordinates: [ [ [ -8932736.873518841, 1995923.68258252 ], [ -8932736.873518841, 6584591.364598221 ], [ -2162250.656131069, 6584591.364598221 ], [ -2162250.656131069, 1995923.68258252 ], [ -8932736.873518841, 1995923.68258252 ] ] ],
            extent: [-8932736.873518841, 1995923.68258252, -2162250.656131069, 6584591.364598221],
            center: [-5547493.764824955, 4290257.523590371]
        });
    });

    it('test getViewportGeometry projection EPSG:900913 world view', () => {

        /*EPSG:900913 -20037508.342789244 - 20037508.342789244 | EPSG:4326 -180 | 180*/
        expect(CoordinatesUtils.getViewportGeometry({
            minx: -77527937.55286229,
            miny: -32150025.592971414,
            maxx: 30799841.925342064,
            maxy: 41268657.319279805
        }, 'EPSG:900913')).toEqual({
            type: 'Polygon',
            radius: 0,
            projection: 'EPSG:900913',
            coordinates: [ [ [ -20037508.342789244, -32150025.59297142 ], [ -20037508.342789244, 41268657.319279306 ], [ 20037508.342789244, 41268657.319279306 ], [ 20037508.342789244, -32150025.59297142 ], [ -20037508.342789244, -32150025.59297142 ] ] ],
            extent: [-20037508.342789244, -32150025.59297142, 20037508.342789244, 41268657.319279306],
            center: [0, 4559315.863153942]
        });
    });

});
