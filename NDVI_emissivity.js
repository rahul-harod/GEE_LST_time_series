exports.emissivity=function(landsat){
  
  var wrap=function(image){
    // select bands
    var Green=ee.Image(ee.Algorithms.If(landsat=='L8',image.select('B3'),image.select('B2')));
    var Red=ee.Image(ee.Algorithms.If(landsat=='L8',image.select('B4'),image.select('B3')));
    var Nir=ee.Image(ee.Algorithms.If(landsat=='L8',image.select('B5'),image.select('B4')));

    
    // NDVI
    var NDVI =image.expression('(nir-red)/(nir+red)',{
          'nir':Nir,
          'red':Red
        }).rename('NDVI');
        
    //Open water bodies
    var NDWI = image.expression('(green-nir)/(green+nir)',{
          'nir':Nir,
          'green':Green
        }).rename('NDWI');
    
    // soil emissivity
    var es_L8=image.expression('-0.00000475*redband+0.9788',{'redband':Red}).rename('es');
    var es_L457=image.expression('-0.00000408*redband+0.9796',{'redband':Red}).rename('es');
    var es=ee.Image(ee.Algorithms.If(landsat==='L8',es_L8,es_L457));
    
    //emissivity
    var ev=0.985;// vegetation emissivity
    var ew= 0.99;// water emissivity
    
    //emissivity estimation by assuming pixel as linear combination of soil and vegetation cover.
    // fractional vegetation cover
    var fvc=image.expression('((ndvi-ndvi_min)/(ndvi_max-ndvi_min))**2',
                              {'ndvi':NDVI,'ndvi_min':0.2,'ndvi_max':0.6});
    fvc=fvc.where(fvc.gt(1.0),1.0);
    // cavity factor
    var c=fvc.expression('0.02*fvc*(1-fvc)',{'fvc':fvc});
    c=c.where(c.eq(0.0),0.005);
    var e_mix=(fvc.multiply(ev)).subtract((fvc.subtract(1)).multiply(es)).add(c);
    var emissivity=ee.Image(0).clip(image.geometry());// blank image
    emissivity=emissivity.where(NDVI.lte(0.2),es);// soil emissivity assignment
    emissivity=emissivity.where(NDVI.gt(0.2).and(NDVI.lt(0.6)),e_mix);// combination of soil and vegetation
    emissivity=emissivity.where(NDVI.gte(0.6),ev);// vegetation emissivity assign
    emissivity=emissivity.where(NDWI.gte(0.0),ew);// water emissivity assignment
    // limiting condition
    emissivity=(emissivity.where(emissivity.gt(0.99),0.99)).rename('Emissivity');
    return image.addBands(emissivity.rename('Emissivity')).set('landsat',landsat);
  };
return wrap;
};
