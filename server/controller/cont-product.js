const { Product, Cart } = require('../models')

class Controller {
    static create (request,response,next){
            Product.create({
                name:request.body.name,
                image_url:request.body.image_url,
                price:request.body.price,
                stock:request.body.stock
            })
            .then(data=>{
                response.json(data)
            })
            .catch(err=>{
                if(err.errors){
                    let errorObj={
                        status:400,
                        msg:[],
                        type:err.errors[0].type
                    }
                    
                    for (let i = 0 ; i < err.errors.length ; i++){
                        errorObj.msg.push(err.errors[i].message)
                    }
                    next(errorObj)
                }else{
                    next({status:500,msg:'internal server error'})
                }
                // response.json(err)
            })
        

    }
    static readProduct(request,response,next){
        Product.findAll()
        .then(result=>{
            response.send(result)
        })
        .catch(err=>{
            next({status:500,msg:'internal server error'})
        })
    }

    static update(request,response,next){
        // console.log(request.params.id)
        
        Product.findOne({where:{id:request.params.id}})
        .then(data=>{
            // console.log(data)
            if(data){
                return Product.update({
                    name:request.body.name,
                    image_url:request.body.image_url,
                    price:request.body.price,
                    stock:request.body.stock
                    },{where:{id:request.params.id}})
            }else{
                // console.log('masuk ga ada')
                //data ga ada
                let error={
                    status:404,msg:"data not found"
                }
                throw (error)
            }
        })
        .then(res=>{
            if(res){
                let obj={
                    msg:'Succes update data',
                    data:{
                        id:request.params.id,
                        name:request.body.name,
                        image_url:request.body.image_url,
                        price:request.body.price,
                        stock:request.body.stock
                    }
                }
                response.json(obj)
            }
        })
        .catch(err=>{
            // console.log(err,'============================ ini error')
            if(err.status===404){
                // console.log('masuk sini')
                let errobj={
                    status:404,
                    msg:err.msg
                }
                next(errobj)
            }
            else{
                if (err.errors){
                    let errorObj={
                        status:400,
                        msg:[],
                        type:err.errors[0].type
                    }
                    
                    for (let i = 0 ; i < err.errors.length ; i++){
                        errorObj.msg.push(err.errors[i].message)
                    }
                    next(errorObj)
                }else{
                    // console.log('masuk ga ada error')
                    next({status:500,msg:'internal server error'})
                }
            }
        })
    }

    static delete(request,response,next){
        // console.log(request.params.id)
        let datum = null
        Product.findOne({where:{id:request.params.id}})
        .then(data=>{

            if(data){
                datum=data
                return Product.destroy({where:{id:request.params.id}})
            }else{  
                let errobj = {
                    status:404,msg:"data not found"
                }
                throw(errobj)
            }
        })
        .then(data=>{
            // console.log('ada data=======================')
            response.send({
                msg:'succesfully delete data',
                id:request.params.id,
                name:datum.name,
                image_url:datum.image_url,
                price:datum.price,
                stock:datum.stock
            })
        })
        .catch(err=>{
            if(err.status==404){
                next(err)
            }else{
                next({
                    status:500,
                    msg:"internal server error"
                })
            }
        })
    }
    static findById(request,response,next){
        Product.findOne({where:{id:request.params.id}})
        .then(data=>{
            if (data){
                response.json(data)
            }else{
                throw ({status:404,msg:"Data not found"})
            }
        })
        .catch(err=>{
            if(err.status){
                next(err)
            }else{
                next({status:500,msg:'internal server error'})
            }
        })
    }
    static addToCart(request,response,next){
      let cartData=null
      console.log(request.authenticationData.custId)
      Product.findOne({where:{
        id:request.params.id,
      }
    })
      .then(data=>{
        return Cart.findOne({where:{ProductId:request.params.id,
          CustId:request.authenticationData.custId
        }})
      })
      .then(result =>{
        console.log(result)
        if (!result){
          console.log('masuk create')
          Product.findOne({where:{id:request.params.id}})
      .then(data=>{
        if(data.stock>=request.body.amount){
          return Cart.create({
            CustId:request.authenticationData.custId,
            ProductId:request.params.id,
            amount:request.body.amount
          })
        }else{
          throw ({status:400,msg:`cannot ${data.name}, more than ${data.stock}`})
        }
      })
      .then(res=>{
        return Cart.findAll({where:{id:res.id}, include:Product})
      })
      .then(data=>{
        response.json(data)
      })
      .catch(err=>{
        if(err.errors){
          let errorObj={
            status:400,
            msg:[],
            type:err.errors[0].type
        }
        for (let i = 0 ; i < err.errors.length ; i++){
            errorObj.msg.push(err.errors[i].message)
        }
        next(errorObj)
        }else{
          if(err.status){
            next(err)
          }else{
            next({status:500,msg:'internal server error'})
          }
        }
      })
        } else {
          console.log('masuk Update')
          if (request.body.amount<=0){
            next ({status:400, msg:"Amount Must be positive value"})
          }
          let newAmt= Number(result.amount) + Number(request.body.amount)
          Cart.update({amount:newAmt},{where:{CustId:request.authenticationData.custId, ProductId:request.params.id}})
          .then(data=>{
            response.json({data,msg:'sukses'})
          })
          .catch(err=>{
            next(err)
          })
        }
      })
      .catch(err=>{
        console.log(err)
        // next(err)
      })


      // Product.findOne({where:{id:request.params.id}})
      // .then(data=>{
      //   if(data.stock>=request.body.amount){
      //     return Cart.create({
      //       CustId:request.authenticationData.custId,
      //       ProductId:request.params.id,
      //       amount:request.body.amount
      //     })
      //   }else{
      //     throw ({status:400,msg:`cannot ${data.name}, more than ${data.stock}`})
      //   }
      // })
      // .then(res=>{
      //   return Cart.findAll({where:{id:res.id}, include:Product})
      // })
      // .then(data=>{
      //   response.json(data)
      // })
      // .catch(err=>{
      //   if(err.errors){
      //     let errorObj={
      //       status:400,
      //       msg:[],
      //       type:err.errors[0].type
      //   }
      //   for (let i = 0 ; i < err.errors.length ; i++){
      //       errorObj.msg.push(err.errors[i].message)
      //   }
      //   next(errorObj)
      //   }else{
      //     if(err.status){
      //       next(err)
      //     }else{
      //       next({status:500,msg:'internal server error'})
      //     }
      //   }
      // })
    }

    static deleteCart(request,response,next){
      let productData=null
      Cart.findOne({where:{id:request.params.id}, include:Product})
      .then(data=>{
        if(data){
          console.log('masuk delete')
          productData=data
          return Cart.destroy({where:{id:request.params.id}})
        }else{
          throw ({status:404,msg:"Data not found"})
        }
      })
      .then(data=>{
        console.log('masuk then')
        response.json({msg:'success delete data',productData})
      })
      .catch(err=>{
        if(err.status){
          next(err)
        }else{
          next({status:500,msg:'internal server error'})
        }
      })
    }

    static getCart(request,response,next){
      Cart.findAll({where:{CustId:request.authenticationData.custId}, include:Product, order:[['id','asc']]})
      .then(data=>{
        response.json(data)
      })
      .catch(err=>{
        console.log(err)
        next({status:500,msg:'internal server error'})
      })
    }


}

module.exports = Controller
