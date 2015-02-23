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
{
    'name' : 'Instant Messaging custom',
    'version': '1.0',
    'summary': 'OpenERP Custom Chat',
    'author': 'Browseinfo',
    'sequence': '18',
    'category': 'Tools',
    'complexity': 'easy',
    'website': 'https://www.browseinfo.in',
    'description':
        """
Instant Messaging
=================
Users to chat with each other in real time using their short user code.

        """,
    'data': [
        'views/im_chat_custom.xml',
        'im_chat_custom.xml'
    ],
    'depends' : ['base', 'web', 'bus','im_chat'],
    'qweb': ['static/src/xml/*.xml'],
    'application': True,
    'installable': True,
    'auto_install': False,
}
