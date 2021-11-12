// MODULES DECLARATION -----------------------------------------------------------
// Total Precipitable Water 
var NCEP_TPW = require('users/rharod4/Time_series:NCEP_NEW.js')
//cloud mask
var cloudmask = require('users/rharod4/Time_series:cloud_mask.js')
//surface emissivity
var EM = require('users/rharod4/Time_series:EVI_NDWI_based_emissivity.js')
// land surface temperature
var LST = require('users/rharod4/Time_series:SMW_algorithm.js')
// --------------------------------------------------------------------------------


var COLLECTION = ee.Dictionary({
  'L4': {
    'TOA': ee.ImageCollection('LANDSAT/LT04/C01/T1_TOA'),
    'SR': ee.ImageCollection('LANDSAT/LT04/C01/T1_SR'),
    'TIR': ['B6',]
  },
  'L5': {
    'TOA': ee.ImageCollection('LANDSAT/LT05/C01/T1_TOA'),
    'SR': ee.ImageCollection('LANDSAT/LT05/C01/T1_SR'),
    'TIR': ['B6',]
  },
  'L7': {
    'TOA': ee.ImageCollection('LANDSAT/LE07/C01/T1_TOA'),
    'SR': ee.ImageCollection('LANDSAT/LE07/C01/T1_SR'),
    'TIR': ['B6_VCID_1','B6_VCID_2'],
  },
  'L8': {
    'TOA': ee.ImageCollection('LANDSAT/LC08/C01/T1_TOA'),
    'SR': ee.ImageCollection('LANDSAT/LC08/C01/T1_SR'),
    'TIR': ['B10','B11']
  }
});


exports.collection = function( Month_start, Month_end ,geometry){
  
  var collection_dict4 = ee.Dictionary(COLLECTION.get('L4'));
  var collection_dict5 = ee.Dictionary(COLLECTION.get('L5'));
  var collection_dict7 = ee.Dictionary(COLLECTION.get('L7'));
  var collection_dict8 = ee.Dictionary(COLLECTION.get('L8'));

  
  var landsatTOA4 = ee.ImageCollection(collection_dict4.get('TOA'))
                .filter(ee.Filter.calendarRange(1983,1988,'year'))
                .filter(ee.Filter.calendarRange(Month_start,Month_end,'month'))
                .filterBounds(geometry)
                .filterMetadata('CLOUD_COVER','less_than',50)
                .map(cloudmask.toa)
                .select(['B6'])
                .map(function(a){
                  return a.set('year',ee.Image(a).date().get('year')).set('product','L4')
                })
  var landsatSR4 = ee.ImageCollection(collection_dict4.get('SR'))
                .filter(ee.Filter.calendarRange(1983,1988,'year'))
                .filter(ee.Filter.calendarRange(Month_start,Month_end,'month'))
                .filterBounds(geometry)
                .filterMetadata('CLOUD_COVER','less_than',50)
                .map(cloudmask.sr)
                .map(NCEP_TPW.addBand)
                .map(EM.emissivity("L4"));
  var landsatALL4 = (landsatSR4.combine(landsatTOA4, true));
  var landsatLST4 = landsatALL4.map(LST.addBand("L4"));
                
  var landsatTOA5 = ee.ImageCollection(collection_dict5.get('TOA'))
                .filter(ee.Filter.calendarRange(1988,2012,'year'))
                .filter(ee.Filter.calendarRange(Month_start,Month_end,'month'))
                .filterBounds(geometry)
                .filterMetadata('CLOUD_COVER','less_than',50)
                .map(cloudmask.toa)
                .select(['B6'])
                .map(function(a){
                  return a.set('year',ee.Image(a).date().get('year')).set('product','L5')
                })
  var landsatSR5 = ee.ImageCollection(collection_dict5.get('SR'))
                .filter(ee.Filter.calendarRange(1988,2012,'year'))
                .filter(ee.Filter.calendarRange(Month_start,Month_end,'month'))
                .filterBounds(geometry)
                .filterMetadata('CLOUD_COVER','less_than',50)
                .map(cloudmask.sr)
                .map(NCEP_TPW.addBand)
                .map(EM.emissivity("L5"));
  var landsatALL5 = (landsatSR5.combine(landsatTOA5, true));
  var landsatLST5 = landsatALL5.map(LST.addBand("L5"));              
  
                
  var landsatTOA7 = ee.ImageCollection(collection_dict7.get('TOA'))
                .filter(ee.Filter.calendarRange(2001,2012,'year'))
                .filter(ee.Filter.calendarRange(Month_start,Month_end,'month'))
                .filterBounds(geometry)
                .filterMetadata('CLOUD_COVER','less_than',50)
                .map(cloudmask.toa)
                .select(['B6_VCID_1','B6_VCID_2'])
                .map(function(a){
                  return a.set('year',ee.Image(a).date().get('year')).set('product','L7')
                })
  var landsatSR7 = ee.ImageCollection(collection_dict7.get('SR'))
                .filter(ee.Filter.calendarRange(2000,2012,'year'))
                .filter(ee.Filter.calendarRange(Month_start,Month_end,'month'))
                .filterBounds(geometry)
                .filterMetadata('CLOUD_COVER','less_than',50)
                .map(cloudmask.sr)
                .map(NCEP_TPW.addBand)
                .map(EM.emissivity("L7"));
  var landsatALL7 = (landsatSR7.combine(landsatTOA7, true));
  var landsatLST7 = landsatALL7.map(LST.addBand("L7"));
  
  var landsatTOA8 = ee.ImageCollection(collection_dict8.get('TOA'))
                .filter(ee.Filter.calendarRange(2013,2021,'year'))
                .filter(ee.Filter.calendarRange(Month_start,Month_end,'month'))
                .filterBounds(geometry)
                .filterMetadata('CLOUD_COVER','less_than',50)
                .map(cloudmask.toa)
                .select(['B10','B11'])
                .map(function(a){
                  return a.set('year',ee.Image(a).date().get('year')).set('product','L8')
                })
  var landsatSR8 = ee.ImageCollection(collection_dict8.get('SR'))
                .filter(ee.Filter.calendarRange(2013,2021,'year'))
                .filter(ee.Filter.calendarRange(Month_start,Month_end,'month'))
                .filterBounds(geometry)
                .filterMetadata('CLOUD_COVER','less_than',50)
                .map(cloudmask.sr)
                .map(NCEP_TPW.addBand)
                .map(EM.emissivity("L8"));
  var landsatALL8 = (landsatSR8.combine(landsatTOA8, true));
  var landsatLST8 = landsatALL8.map(LST.addBand("L8"));     
  
  
  var AllLST=ee.ImageCollection(landsatLST4.merge(landsatLST5.merge(landsatLST7.merge(landsatLST8))));
  
  return AllLST;
};