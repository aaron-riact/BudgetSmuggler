const {observable} = require("mobx");

const sumChildren = (children) =>
  children
    .map(node => node.values)
    .reduce((vals1, vals2) =>
      vals1.map((v,i) => (v || 0) + (vals2[i] || 0) ), [0,0,0,0,0,0,0,0,0,0,0,0]
    )

const makeNewChild = (parent, parentClass, e) => {
  if(e) e.stopPropagation(); 
  if(parentClass==='category') parent.extendeds.push({name: 'ext', values:Array(12)}); 
  if(parentClass==='section') parent.categories.push({
    name: 'cat',
    open: true,
    values:function() { console.log('CATN', this); return sumChildren(this.extendeds) },
    extendeds: []
  });
  if(parentClass==='root') parent.sections.push({
    name: 'sec',
    open: true,
    values: function() { console.log('ZZ'); return  sumChildren(this.categories) },
    categories: []
  })
}

const appState = observable({
  editing: false,
  editingNode: null,
  total: function() { console.log('TOT'); return sumChildren(this.sections) },
  sections: [
    {
      name: 'section 1',
      open: true,
      values: function() { console.log('ZZ'); return  sumChildren(this.categories) }, 
      categories: [
        {
          name: 'category 1',
          open: true,
          values: function() { console.log('YY'); return sumChildren(this.extendeds) },
          extendeds: [
            {
              name: 'extended 1',
              values: [1,2,3,4,5,6,7,8,9,10,11,12]
            },
            {
              name: 'extended 2',
              values: [1,2,3,4,5,6,7,8,9,10,11,12]
            },
            {
              name: 'extended 3',
              values: [1,2,3,4,5,6,7,8,9,10,11,12]
            },
          ]
        }
      ]
    },
    {
      name: 'section 2',
      open: true,
      values: function() { console.log('SEC'); return sumChildren(this.categories) },
      categories: [
        {
          name: 'category 1',
          open: true,
          values: function() { console.log('CAT'); return sumChildren(this.extendeds) },
          extendeds: [
            {
              name: 'extended 1',
              values: [1,2,3,4,5,6,7,8,9,10,11,12] 
            },
            {
              name: 'extended 2',
              values: [1,2,3,4,5,6,7,8,9,10,11,12]
            },
            {
              name: 'extended 3',
              values: [1,2,3,4,5,6,7,8,9,10,11,12]
            },
          ]
        }
      ]
    },
  ]
});

module.exports = {appState, makeNewChild}
