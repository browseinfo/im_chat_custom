{
    'name' : 'Instant Messaging custom',
    'version': '1.0',
    'author': 'Browseinfo',
    'sequence': '18',
    'category': 'Tools',
    'complexity': 'easy',
    'website': 'https://www.browseinfo.in',
    'description':
        """
Instant Messaging
=================

Allows users to chat with each other in real time. Find other users easily and
chat in real time. It support several chats in parallel.
        """,
    'data': [
        'views/im_chat_custom.xml',
    ],
    'depends' : ['base', 'web', 'bus','im_chat'],
    'qweb': ['static/src/xml/*.xml'],
    'application': True,
    'installable': True,
    'auto_install': True,
}
