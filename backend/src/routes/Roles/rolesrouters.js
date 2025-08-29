const express =require('express');
const router=express.Router();
const roles = require('../../controllers/roles/rolesController');


router.post('/add',roles.addRoles);
router.get('/search',roles.searchRole);
router.get('/all-roles',roles.getAllRoles);
router.delete('/delete/:id',roles.deleteRole);
router.put('/update/:id',roles.updateRole)


module.exports=router;