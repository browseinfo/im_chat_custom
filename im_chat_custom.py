# -*- coding: utf-8 -*-
##############################################################################
#
#    This module uses OpenERP, Open Source Management Solution Framework.
#    Copyright (C) 2014-Today BrowseInfo (<http://www.browseinfo.in>)
#
#    This program is free software: you can redistribute it and/or modify
#    it under the terms of the GNU General Public License as published by
#    the Free Software Foundation, either version 3 of the License, or
#    (at your option) any later version.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU General Public License for more details.
#
#    You should have received a copy of the GNU General Public License
#    along with this program.  If not, see <http://www.gnu.org/licenses/>
#
##############################################################################
import openerp
from openerp.http import request
from openerp.osv import osv, fields

class res_users(osv.Model):
    _inherit = "res.users"

    _columns = {
        'user_code' : fields.char('User Code', size=5),
    }

    def im_search(self, cr, uid, name, limit=20, context=None):
        """ search users with a name and return its id, name and im_status """
        result = [];
        # find the employee group
        group_employee = self.pool['ir.model.data'].get_object_reference(cr, uid, 'base', 'group_user')[1]

        where_clause_base = " U.active = 't' "
        query_params = ()
        if name:
            where_clause_base += " AND P.name ILIKE %s "
            query_params = query_params + ('%'+name+'%',)

        # first query to find online employee
        cr.execute('''SELECT U.id as id, U.user_code as user_code, P.name as name, COALESCE(S.status, 'offline') as im_status
                FROM im_chat_presence S
                    JOIN res_users U ON S.user_id = U.id
                    JOIN res_partner P ON P.id = U.partner_id
                WHERE   '''+where_clause_base+'''
                        AND U.id != %s
                        AND EXISTS (SELECT 1 FROM res_groups_users_rel G WHERE G.gid = %s AND G.uid = U.id)
                        AND S.status = 'online'
                ORDER BY P.name
                LIMIT %s
        ''', query_params + (uid, group_employee, limit))
        result = result + cr.dictfetchall()
        # second query to find other online people
        if(len(result) < limit):
            cr.execute('''SELECT U.id as id, U.user_code as user_code, P.name as name, COALESCE(S.status, 'offline') as im_status
                FROM im_chat_presence S
                    JOIN res_users U ON S.user_id = U.id
                    JOIN res_partner P ON P.id = U.partner_id
                WHERE   '''+where_clause_base+'''
                        AND U.id NOT IN %s
                        AND S.status = 'online'
                ORDER BY P.name
                LIMIT %s
            ''', query_params + (tuple([u["id"] for u in result]) + (uid,), limit-len(result)))
            result = result + cr.dictfetchall()
        # third query to find all other people
        if(len(result) < limit):
            cr.execute('''SELECT U.id as id, U.user_code as user_code, P.name as name, COALESCE(S.status, 'offline') as im_status
                FROM res_users U
                    LEFT JOIN im_chat_presence S ON S.user_id = U.id
                    LEFT JOIN res_partner P ON P.id = U.partner_id
                WHERE   '''+where_clause_base+'''
                        AND U.id NOT IN %s
                ORDER BY P.name
                LIMIT %s
            ''', query_params + (tuple([u["id"] for u in result]) + (uid,), limit-len(result)))
            result = result + cr.dictfetchall()
        return result

class im_chat_session(osv.Model):
    _inherit = 'im_chat.session'

    def users_infos(self, cr, uid, ids, context=None):
        """ get the user infos for all the user in the session """
        for session in self.pool["im_chat.session"].browse(cr, uid, ids, context=context):
            users_infos = self.pool["res.users"].read(cr, uid, [u.id for u in session.user_ids], ['id','name', 'im_status', 'user_code'], context=context)
            return users_infos