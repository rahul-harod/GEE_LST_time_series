// select bands
exports.emissivity=function(landsat){
  var wrap=function(image){
    var Blue=ee.Image(ee.Algorithms.If(landsat=='L8',image.select('B2'),image.select('B1')));
    var Green=ee.Image(ee.Algorithms.If(landsat=='L8',image.select('B3'),image.select('B2')));
    var Red=ee.Image(ee.Algorithms.If(landsat=='L8',image.select('B4'),image.select('B3')));
    var Nir=ee.Image(ee.Algorithms.If(landsat=='L8',image.select('B5'),image.select('B4')));
    var Swir=ee.Image(ee.Algorithms.If(landsat=='L8',image.select('B6'),image.select('B5')));
    
    // NDVI
    var NDVIband =image.expression('(nir-red)/(nir+red)',{
          'nir':Nir,
          'red':Red
        }).rename('NDVI');
        
    //NDWI
    var NDWIband =image.expression('(nir-swir)/(nir+swir)',{
          'nir':Nir,
          'swir':Swir
        }).rename('NDWI');
        
    //EVI
    var EVIband =image.expression('2.5*(nir-red)/(nir+6*red-7.5*blue+10000)',{
          'nir':Nir,
          'red':Red,
          'blue':Blue
        }).rename('EVI');
    
    //Open water bodies
    var NDWIwater = image.expression('(green-nir)/(green+nir)',{
          'nir':Nir,
          'green':Green
        }).rename('NDWIwater');
    
    // Urban area NDBI
    var NDBIband= image.expression('(swir-nir)/(nir+swir)',{
          'nir':Nir,
          'swir':Swir
        }).rename('NDBI');
    

    // soil emissivity
    var es_L8=image.expression('-0.00000475*redband+0.9788',{'redband':Red}).rename('es');
    var es_L457=image.expression('-0.00000408*redband+0.9796',{'redband':Red}).rename('es');
    var es=ee.Image(ee.Algorithms.If(landsat==='L8',es_L8,es_L457));
    
    //vegetation, water and concrete emissivity
    var ev=0.985;// vegetation emissivity
    var ew= 0.99;
    var ec=0.948;
    
    //function for vegetated region emissivity
    var fvc_veg=image.expression('((ndwi-ndwi_min)/(ndwi_max-ndwi_min))**2',
                              {'ndwi':NDWIband,'ndwi_min':-0.02,'ndwi_max':0.4});
    fvc_veg=fvc_veg.where(fvc_veg.lt(0.0),0.0);
    fvc_veg=fvc_veg.where(fvc_veg.gt(1.0),1.0);
    var c_veg=fvc_veg.expression('0.02*fvc*(1-fvc)',{'fvc':fvc_veg});
    c_veg=c_veg.where(c_veg.eq(0.0),0.005);
    var e_mix_veg=(fvc_veg.multiply(ev)).subtract((fvc_veg.subtract(1)).multiply(es)).add(c_veg);
    var veg_emissivity=ee.Image(0).clip(image.geometry());
    veg_emissivity=veg_emissivity.where(NDWIband.lte(-0.02),es);
    veg_emissivity=veg_emissivity.where(NDWIband.gt(-0.02).and(NDWIband.lt(0.4)),e_mix_veg);
    veg_emissivity=veg_emissivity.where(NDWIband.gte(0.4),ev);
    veg_emissivity=veg_emissivity.where(NDWIwater.gte(0.0),ew);
            // limiting conditions
    veg_emissivity=veg_emissivity.where(veg_emissivity.lt(0.93),0.93);
    veg_emissivity=(veg_emissivity.where(veg_emissivity.gt(0.99),0.99)).rename('V_Emissivity');
    
    // function for non vegetated region emissivity


    var fvc_NV=image.expression('((evi-evi_min)/(evi_max-evi_min))**2',
                              {'evi':EVIband,'evi_min':0.12,'evi_max':0.41});
    fvc_NV=fvc_NV.where(fvc_NV.lt(0.0),0.0);
    fvc_NV=fvc_NV.where(fvc_NV.gt(1.0),1.0);
    var c_NV=fvc_NV.expression('0.02*fvc*(1-fvc)',{'fvc':fvc_NV});
    c_NV=c_NV.where(c_NV.eq(0.0),0.005);
    var e_mix_NV=(fvc_NV.multiply(ev)).subtract((fvc_NV.subtract(1)).multiply(es)).add(c_NV);
    var emissivity_NV=ee.Image(0).clip(image.geometry());
    emissivity_NV=emissivity_NV.where(EVIband.lte(0.12),es);
    emissivity_NV=emissivity_NV.where(EVIband.gt(0.12).and(EVIband.lt(0.41)),e_mix_NV);
    emissivity_NV=emissivity_NV.where(EVIband.gte(0.41),ev);
    emissivity_NV=emissivity_NV.where(NDWIwater.gte(0.0),ew);
            // limiting conditions
    emissivity_NV=emissivity_NV.where(emissivity_NV.lt(0.93),0.93);
    emissivity_NV=(emissivity_NV.where(emissivity_NV.gt(0.99),0.99)).rename('NV_Emissivity');

 
    // mixed indices emissivity
    var E_mix=ee.Image(0).clip(image.geometry());
    E_mix=E_mix.where(NDVIband.lte(0.25),emissivity_NV);
    E_mix=E_mix.where(NDVIband.gt(0.25),veg_emissivity);
    
   
    return  image.addBands(E_mix.rename('Emissivity'));
  };
return wrap;
};